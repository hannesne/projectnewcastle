export interface ISettings {
  patientCollection: string;
  patientTestDatabase: string | undefined;
  mongoConnectionString: string;
  allowSelfSignedMongoCert: boolean;
}