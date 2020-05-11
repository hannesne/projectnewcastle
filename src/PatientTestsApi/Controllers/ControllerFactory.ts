import { PatientController } from "./PatientController";
import { Db, MongoClient } from "mongodb";
import { ISettings } from "../Models/ISettings";
import { ICollection } from "../Services/ICollection";
import { PatientDataService } from "../Services/PatientDataService";
import { EnvironmentSettings } from "../Models/EnvironmentSettings";

export class ControllerFactory {

  private static mongoDb: Promise<Db>;
  private readonly settings: ISettings;

  constructor () {
    this.settings = new EnvironmentSettings();  
  }

 

  public async createPatientController(): Promise<PatientController> {
    const collection = await this.CreateCollection(this.settings.patientCollection);
    const dataService: PatientDataService = new PatientDataService(collection);
    return new PatientController(dataService);
  }


  private async CreateCollection(collectionName: string): Promise<ICollection> {
    if (ControllerFactory.mongoDb == null) {
      ControllerFactory.mongoDb = this.createMongoDb();
    }
    const collection = (await ControllerFactory.mongoDb).collection(collectionName);
    return collection;
  }

  private async createMongoDb(): Promise<Db> {
    // connect and select database
    const mongoClient = await MongoClient.connect(this.settings.mongoConnectionString,
      { useUnifiedTopology: true, useNewUrlParser: true, tlsAllowInvalidCertificates: this.settings.allowSelfSignedMongoCert });
    
    return mongoClient.db(this.settings.patientTestDatabase);
  }
}