/* eslint-disable @typescript-eslint/no-explicit-any */
import { ICollection } from "./ICollection";
import { CollectionInsertOneOptions, InsertOneWriteOpResult } from "mongodb";
import { Timer } from "./app-insights/timer";
import { AppInsightsService, IDependencyTelemetry } from "./app-insights/app-insights-service";

export class LoggingCollection implements ICollection {
  
  constructor(
    private readonly collection: ICollection,
    private readonly appInsights: AppInsightsService,
    private readonly collectionName: string,
    private readonly dbName: string) {}

  insertOne(
    docs: any,
    options?: CollectionInsertOneOptions | undefined
  ): Promise<InsertOneWriteOpResult<any>> {
    const mongoRequest = JSON.stringify({insertOne: {options}});
    return this.trackDependency(() => this.collection.insertOne(docs, options), mongoRequest);
  }

  private async trackDependency<T>(fn: () => Promise<T>, query: string): Promise<T> {
    const timer = new Timer();

    try {
      const result = await fn();
      timer.stop();
      this.appInsights.trackDependency(this.createDependency(query, timer, 0, true));
      return result;

    } catch (e) {
      timer.stop();
      this.appInsights.trackDependency(this.createDependency(query, timer, JSON.stringify(e), false));
      throw e;
    }
  }

  private createDependency(query: string, timer: Timer, resultCode: number | string, success: boolean): IDependencyTelemetry {
    return { data: query,
      dependencyTypeName: "mongodb",
      duration: timer.duration,
      time: timer.endDate,
      resultCode,
      success,
      name: this.dbName,
      target: this.collectionName };
  }
}
