import { ITest } from "../Models/ITest";

export interface ITestDataService {
  insertTest(test: ITest): Promise<string>;
  loadTests(patientId: string): Promise<ITest[]>;
  loadTests(patientId: string, testId: string | undefined): Promise<ITest[] | null>;
}
