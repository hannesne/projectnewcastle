import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { PatientController } from "../Controllers/PatientController";
import { PatientDataService } from "../Services/PatientDataService";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const controller = new PatientController(new PatientDataService());
  context.res = await controller.createPatient(req);
};

export default httpTrigger;