# The problem:
using lambda to talk to mongodb.
The mongodb connection is created outside of the lambda handler (means it is in the container). When a failure (such as mongoose validation error) happens, something (I don't know what) is trying to update the connection. 


After mongo fail, the lambda fails too, but it will not destroy the connection in the lambda container/ set it to null. This leads to:

# Consequence:
All the following lambda functions that's been bootup using the same container will try to reuse the connection. And will get the following error:
```
Error saving customer { MongoError: no connection available for operation and number of stored operation > 0
at Function.create (/var/task/node_modules/mongodb-core/lib/error.js:43:12)
at Store.add (/var/task/node_modules/mongodb/lib/topologies/topology_base.js:38:18)
at executeWriteOperation (/var/task/node_modules/mongodb-core/lib/topologies/replset.js:1187:39)
at ReplSet.insert (/var/task/node_modules/mongodb-core/lib/topologies/replset.js:1241:3)
at ReplSet.insert (/var/task/node_modules/mongodb/lib/topologies/topology_base.js:321:25)
at insertDocuments (/var/task/node_modules/mongodb/lib/operations/collection_ops.js:821:19)
at insertOne (/var/task/node_modules/mongodb/lib/operations/collection_ops.js:851:3)
at executeOperation (/var/task/node_modules/mongodb/lib/utils.js:420:24)
at Collection.insertOne (/var/task/node_modules/mongodb/lib/collection.js:463:10)
at NativeCollection.(anonymous function) [as insertOne] (/var/task/node_modules/mongoose/lib/drivers/node-mongodb-native/collection.js:146:28)
at model.Model.$__handleSave (/var/task/node_modules/mongoose/lib/model.js:206:21)
at model.Model.$__save (/var/task/node_modules/mongoose/lib/model.js:275:8)
at /var/task/node_modules/kareem/index.js:278:20
at _next (/var/task/node_modules/kareem/index.js:102:16)
at process.nextTick (/var/task/node_modules/kareem/index.js:499:38)
at _combinedTickCallback (internal/process/next_tick.js:131:7)
driver: true,
name: 'MongoError',
[Symbol(mongoErrorContextSymbol)]: {} }
```

# Solution:
Still working on it.