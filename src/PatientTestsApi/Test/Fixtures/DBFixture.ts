import { Db, MongoClient, Collection, FilterQuery, FindOneOptions } from "mongodb";
import { ISettings } from "../../Models/ISettings";
import { ICollection } from "../../Services/ICollection";
import { FileSettings } from "./FileSettings";

export class DBFixture {
  public mongoDb: Db;
  public mongoClient: MongoClient;
  public settings: ISettings;

  constructor(){
    this.mongoDb = {} as Db;
    this.mongoClient = {} as MongoClient; 
    this.settings = new FileSettings();
  }

  public async init(): Promise<void> {

    // connect and select database
    this.mongoClient = await MongoClient.connect(this.settings.mongoConnectionString,
      { useUnifiedTopology: true, useNewUrlParser: true, tlsAllowInvalidCertificates: true });
    
    this.mongoDb = this.mongoClient.db(this.settings.patientTestDatabase);
  }

  public createPatientCollection(): ICollection {
    return this.createCollection(this.settings.patientCollection);
  }

  public async cleanPatients(): Promise<void> {
    await this.mongoDb.collection(this.settings.patientCollection).deleteMany({});
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async loadPatient(id: string): Promise<any> {
    return await this.mongoDb.collection(this.settings.patientCollection).findOne({_id: id});
  }
  
  public createTestCollection(): ICollection {
    const mongoCollection = this.createCollection(this.settings.testCollection);
    return mongoCollection;
  }

  private createCollection(collectionName: string): ICollection {
    const mongoCollection = this.mongoDb.collection(collectionName) as unknown as ICollection & Collection<any>;
    mongoCollection.findMany = function (query: FilterQuery<any>, options?: FindOneOptions | undefined): Promise<any[]> {
      return this.find(query, options).toArray();
    };
    return mongoCollection;
  }

  public async cleanTests(): Promise<void> {
    await this.mongoDb.collection(this.settings.testCollection).deleteMany({});
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async loadTest(id: string): Promise<any> {
    // todo: check if we need to specify a shard key if we're finding by _id.
    return await this.mongoDb.collection(this.settings.testCollection).findOne({_id: id});
  }
  

  public async close(): Promise<void> {
    // close the connection
    await this.mongoClient.close(true);
  }
}