import { IPatientDataService } from "./IPatientDataService";
import { IPatient } from "../Models/IPatient";
import { ICollection } from "./ICollection";
import { InsertFailedError } from "../Models/InsertFailedError";

export class PatientDataService implements IPatientDataService {
  constructor (private readonly collection: ICollection) {

  }

  public async insertPatient(patient: IPatient): Promise<string> {
    const dbPatient: IDBPatient = {
      ...patient,
      _id: patient.id!,
      _shardKey: patient.id!
    };

    const result = await this.collection.insertOne(dbPatient);
    if (result.insertedCount > 0) {
      return dbPatient._id;
    }
    else {
      throw new InsertFailedError();
    }
  }

  public async findPatient(id: string): Promise<IPatient> {
    const filter = { id };
    console.info('Query is ' + JSON.stringify(filter));
    const result: IPatient = await this.collection.findOne(filter) as IPatient;

    return result;
  }
}

interface IDBPatient extends IPatient {
  _id: string;
  _shardKey: string;
}


