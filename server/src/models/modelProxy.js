const { getMongoConnected, createMemoryModel } = require('../config/memoryStore');

function proxyModel(collectionName, mongooseModel, schemaMethods = {}) {
  const memoryModel = createMemoryModel(collectionName, schemaMethods);

  function ModelDispatcher(data) {
    if (getMongoConnected()) {
      return new mongooseModel(data);
    }
    return new memoryModel(data);
  }

  return new Proxy(ModelDispatcher, {
    get(target, prop) {
      if (getMongoConnected()) {
        const val = mongooseModel[prop];
        return typeof val === 'function' ? val.bind(mongooseModel) : val;
      } else {
        const val = memoryModel[prop];
        return typeof val === 'function' ? val.bind(memoryModel) : val;
      }
    }
  });
}

module.exports = { proxyModel };
