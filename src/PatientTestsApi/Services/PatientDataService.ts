import { IPatientDataService } from "./IPatientDataService";
import { IPatient, IPatientSearch } from "../Models/IPatient";
import { ICollection } from "./ICollection";
import { InsertFailedError } from "../Models/InsertFailedError";
import { UpdateFailedError } from "../Models/UpdateFailedError";

export class PatientDataService implements IPatientDataService {
  constructor (private readonly collection: ICollection) {

  }

  public async insertPatient(patient: IPatient): Promise<string> {
    const dbPatient: IDBPatient = {
      ...patient,
      _id: patient.id!,
      _shardKey: patient.id!,
      _dateOfBirthDate: new Date(patient.dateOfBirth)
    };

    const result = await this.collection.insertOne(dbPatient);
    if (result.insertedCount > 0) {
      return dbPatient._id;
    }
    else {
      throw new InsertFailedError();
    }
  }

  public async findPatient(id: string): Promise<IPatient | null> {
    const filter = { id };
    const result: IPatient = await this.collection.findOne(filter) as IPatient;

    if (result) {
      // remove database properties
      delete result._id;
      delete result._shardKey;
      delete result._dateOfBirthDate;
    }

    return result;
  }

  public async updatePatient(patient: IPatient): Promise<string | null> {
    const dbPatient: IDBPatient = {
      ...patient,
      _id: patient.id!,
      _shardKey: patient.id!,
      _dateOfBirthDate: new Date(patient.dateOfBirth)
    };

    const filter = { _id: dbPatient._id, _shardKey: dbPatient._shardKey };
    const result = await this.collection.updateOne(
      filter,
      {
        $set: patient
      }
    );

    if (result.modifiedCount > 0) {
      return patient.id!;
    }
    else {
      throw new UpdateFailedError();
    }
  }

  // searches patients
  public async searchPatient(patientSearch: IPatientSearch): Promise<IPatient[]> {
    const filter = { };
    const result = await this.collection.findMany(filter);
    const patients: IPatient[] = [];

    if (result) {
      result.forEach(x => {
        // remove database properties
        delete x._id;
        delete x._shardKey;
        delete x._dateOfBirthDate;

        patients.push(x);
      });
    }

    return patients;
  }
}

interface IDBPatient extends IPatient {
  _id: string;
  _shardKey: string;
  _dateOfBirthDate: Date;  
}


