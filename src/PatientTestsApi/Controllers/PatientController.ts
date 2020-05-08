import { HttpRequest } from "@azure/functions";
import { IPatient, PatientSchema } from "../Models/IPatient";
import { IResponse } from "../Models/IResponse";
import { IPatientDataService } from "../Services/IPatientDataService";
import { SuccessResponse} from "../Models/SuccessResponse";
import { BadRequestResponse } from "../Models/BadRequestResponse";

export class PatientController {
  public constructor(
    private readonly patientDataService: IPatientDataService
  ) {}

  public async createPatient(req: HttpRequest): Promise<IResponse> {
    
    const validationResult = PatientSchema.validate(req.body);
    if (validationResult.error != null) {
      return new BadRequestResponse(validationResult.error.message);
    }

    if (req.body.id != null) {
      return new BadRequestResponse("Id unexpected.");
    }

    const patient = req.body as IPatient || {};
    
    const id = await this.patientDataService.insertPatient(patient);
    patient.id = id;
    return new SuccessResponse(patient);
  }
}


