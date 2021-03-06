import { IAuditRecord } from "../../Models/IAuditRecord";

export class AuditRecordFixture {
  public static readonly CreateAuditRecordId = "df5ad95e-05e9-4a22-aac0-f74164c623ac";

  public static createAuditRecordForCreatingInDb(): IAuditRecord {
    return {
      resource: 
      {
        id: "resourceid",
        operation: "resourceoperation",
        type: "resourcetype"
      },
      sourceSystemName: "sourcesystem",
    };
  }

  public static createAuditRecord(): IAuditRecord {
    const auditRecord: IAuditRecord = AuditRecordFixture.createAuditRecordForCreatingInDb();
    auditRecord.id = AuditRecordFixture.CreateAuditRecordId;
    auditRecord.createdDate = new Date("2020-05-07T04:20:44.454Z");
    return auditRecord;
  }
}