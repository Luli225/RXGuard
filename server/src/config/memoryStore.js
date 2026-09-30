/**
 * In-Memory Database Store Fallback (Zero-Dependency & Zero-Download)
 * Allows RxGuard to run instantly in any Node environment even when MongoDB is offline,
 * while automatically switching to real MongoDB whenever MONGODB_URI connects.
 */

let isMongoConnected = false;

function setMongoConnected(status) {
  isMongoConnected = status;
}

function getMongoConnected() {
  return isMongoConnected;
}

// In-memory collections
const collections = {
  User: [],
  Patient: [],
  Drug: [],
  BatchInventory: [],
  Prescription: [],
  SafetyAlert: [],
  OverrideLog: [],
  AuditLog: []
};

// Helper: Generate simulated 24-char ObjectId
function generateId() {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// Helper: Query matcher
function matchesQuery(doc, query = {}) {
  if (!query || Object.keys(query).length === 0) return true;

  for (const [key, val] of Object.entries(query)) {
    if (key === '$or' && Array.isArray(val)) {
      const orMatched = val.some(subQ => matchesQuery(doc, subQ));
      if (!orMatched) return false;
      continue;
    }

    const docVal = doc[key];

    if (val instanceof RegExp) {
      if (!val.test(String(docVal || ''))) return false;
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      if (val.$gte !== undefined && docVal < val.$gte) return false;
      if (val.$lte !== undefined && docVal > val.$lte) return false;
      if (val.$regex !== undefined) {
        const r = new RegExp(val.$regex, val.$options || '');
        if (!r.test(String(docVal || ''))) return false;
      }
    } else if (val !== undefined) {
      if (String(docVal) !== String(val)) return false;
    }
  }

  return true;
}

// Memory Query Builder
class MemoryQuery {
  constructor(collectionName, items) {
    this.collectionName = collectionName;
    this.items = [...items];
  }

  sort(sortRules = {}) {
    this.items.sort((a, b) => {
      for (const [key, dir] of Object.entries(sortRules)) {
        let valA = a[key];
        let valB = b[key];
        if (valA instanceof Date) valA = valA.getTime();
        if (valB instanceof Date) valB = valB.getTime();

        if (valA < valB) return dir === -1 ? 1 : -1;
        if (valA > valB) return dir === -1 ? -1 : 1;
      }
      return 0;
    });
    return this;
  }

  limit(count) {
    this.items = this.items.slice(0, count);
    return this;
  }

  populate(path) {
    // Populate simple references
    const pathField = typeof path === 'string' ? path : path?.path;
    if (!pathField) return this;

    for (const item of this.items) {
      const refVal = item[pathField];
      if (!refVal) continue;

      if (pathField === 'patient') {
        const pat = collections.Patient.find(p => String(p._id) === String(refVal._id || refVal));
        if (pat) item.patient = pat;
      } else if (pathField === 'safetyAlerts' && Array.isArray(refVal)) {
        item.safetyAlerts = refVal.map(ref => {
          return collections.SafetyAlert.find(a => String(a._id) === String(ref._id || ref)) || ref;
        });
      } else if (pathField === 'overrides' && Array.isArray(refVal)) {
        item.overrides = refVal.map(ref => {
          return collections.OverrideLog.find(o => String(o._id) === String(ref._id || ref)) || ref;
        });
      } else if (pathField === 'alertId') {
        const alt = collections.SafetyAlert.find(a => String(a._id) === String(refVal._id || refVal));
        if (alt) item.alertId = alt;
      }
    }
    return this;
  }

  then(resolve, reject) {
    return Promise.resolve(this.items).then(resolve, reject);
  }
}

// In-Memory Model Wrapper Factory
function createMemoryModel(collectionName, schemaMethods = {}) {
  const col = collections[collectionName];

  function wrapDoc(rawDoc) {
    if (!rawDoc) return null;
    const doc = { ...rawDoc };

    // Attach instance methods
    for (const [name, fn] of Object.entries(schemaMethods)) {
      doc[name] = fn.bind(doc);
    }

    doc.toObject = () => ({ ...rawDoc });
    doc.save = async function() {
      if (!doc._id) doc._id = generateId();
      if (!doc.createdAt) doc.createdAt = new Date();
      doc.updatedAt = new Date();

      const existingIdx = col.findIndex(item => String(item._id) === String(doc._id));
      if (existingIdx >= 0) {
        col[existingIdx] = { ...doc };
      } else {
        col.push({ ...doc });
      }
      return doc;
    };

    return doc;
  }

  class ModelConstructor {
    constructor(data = {}) {
      const doc = wrapDoc({
        _id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      });
      return doc;
    }

    static find(query = {}) {
      const matched = col.filter(item => matchesQuery(item, query)).map(wrapDoc);
      return new MemoryQuery(collectionName, matched);
    }

    static async findOne(query = {}) {
      const item = col.find(i => matchesQuery(i, query));
      return wrapDoc(item);
    }

    static async findById(id) {
      const item = col.find(i => String(i._id) === String(id));
      const wrapped = wrapDoc(item);
      return new MemoryQuery(collectionName, wrapped ? [wrapped] : []).then(arr => arr[0] || null);
    }

    static async findByIdAndUpdate(id, update = {}, options = {}) {
      const idx = col.findIndex(i => String(i._id) === String(id));
      if (idx === -1) return null;
      col[idx] = { ...col[idx], ...update, updatedAt: new Date() };
      return wrapDoc(col[idx]);
    }

    static async findOneAndUpdate(query = {}, update = {}, options = {}) {
      const idx = col.findIndex(i => matchesQuery(i, query));
      if (idx === -1) {
        if (options.upsert) {
          const newDoc = { _id: generateId(), createdAt: new Date(), updatedAt: new Date(), ...update };
          col.push(newDoc);
          return wrapDoc(newDoc);
        }
        return null;
      }
      col[idx] = { ...col[idx], ...update, updatedAt: new Date() };
      return wrapDoc(col[idx]);
    }

    static async deleteMany(query = {}) {
      const initialLen = col.length;
      if (!query || Object.keys(query).length === 0) {
        col.length = 0;
        return { deletedCount: initialLen };
      }
      const kept = col.filter(item => !matchesQuery(item, query));
      const deletedCount = col.length - kept.length;
      col.length = 0;
      col.push(...kept);
      return { deletedCount };
    }

    static async countDocuments(query = {}) {
      return col.filter(item => matchesQuery(item, query)).length;
    }
  }

  return ModelConstructor;
}

module.exports = {
  setMongoConnected,
  getMongoConnected,
  collections,
  createMemoryModel
};
