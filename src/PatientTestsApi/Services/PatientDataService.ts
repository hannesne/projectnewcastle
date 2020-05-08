import { IPatientDataService } from "./IPatientDataService";
import { IPatient } from "../Models/IPatient";

export class PatientDataService implements IPatientDataService {
  insertPatient (patient: IPatient): Promise<string> {
    throw new Error("Method not implemented." + patient);
  }
}
