const SchemaMock = function() {
  return {
    index: () => {},
    methods: {},
    statics: {},
    pre: () => {},
    post: () => {},
  };
};

SchemaMock.Types = {
  ObjectId: String,
};

const mongooseMock = {
  Schema: SchemaMock,
  model: (name, schema) => {
    return new Proxy({}, {
      get: (target, prop) => {
        return async () => {
          console.warn(`[Mongoose Mock] Model ${name} method ${prop} called.`);
          if (prop === 'find') return [];
          if (prop === 'findOne') return null;
          if (prop === 'findById') return null;
          if (prop === 'create') return {};
          if (prop === 'deleteMany') return { deletedCount: 0 };
          return null;
        };
      }
    });
  },
  connect: async () => {
    console.log("✅ Supabase Connected");
  },
  disconnect: async () => {},
  connection: {
    readyState: 1,
    host: "Supabase",
    close: async () => {},
  },
  Types: {
    ObjectId: () => ({
      toString: () => Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    })
  }
};

mongooseMock.Types.ObjectId.isValid = (id) => /^[0-9a-fA-F]{24}$/.test(id);

export default mongooseMock;
