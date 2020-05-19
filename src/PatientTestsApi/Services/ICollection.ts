/* eslint-disable @typescript-eslint/no-explicit-any */
import { CollectionInsertOneOptions, InsertOneWriteOpResult, FilterQuery, FindOneOptions, Collection } from "mongodb";

export interface ICollection {
  insertOne(docs: any, options?: CollectionInsertOneOptions): Promise<InsertOneWriteOpResult<any>>;
  findOne(filter: FilterQuery<any>, options?: FindOneOptions): Promise<any>;
  findMany(query: FilterQuery<any>, options?: FindOneOptions): Promise<any[]>;
}

export function patchMongoCollection(mongoCollection: Collection<any>): ICollection {
  const patchedCollection = mongoCollection as unknown as ICollection & Collection<any>;
  patchedCollection.findMany = function (query: FilterQuery<any>, options?: FindOneOptions | undefined): Promise<any[]> {
    return this.find(query, options).toArray();
  };
  return patchedCollection;
}
