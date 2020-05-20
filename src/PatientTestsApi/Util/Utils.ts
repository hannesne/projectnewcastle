import moment from "moment";
import { ISearchCriteriaFragment } from "../Models/Search";
import { IPatientSearch } from "../Models/IPatient";

/**
 * Remove undefined properties from a JavaScript object.
 * Useful when attempting to avoid sending undefined params to a http endpoint
 *
 * Taken from https://stackoverflow.com/a/38340374/2442468
 */
// tslint:disable: no-any no-unsafe-any
export const removeUndefinedPropertiesFromObject = (obj: any) => {
  Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
};

/**
 * Checks if an object has any properties left that are empty, or null.
 *
 * Taken from https://stackoverflow.com/a/49427583
 */
export const isObjectEmpty = (object: any): boolean =>
  !Object.values(object).some(x => (x !== null && x !== ''));

/**
 * Removes time from a Date object.
 * @param date date whose time will be removed
 */
export const removeTimeFromDate = (date: Date): Date => {
  const day = moment(date);
  return day.startOf('day').toDate();
};

/**
 * Resets a Date object to the end of the previous day
 * @param date date to reset to the end of the previous day
 */
export const setDateToEndOfPreviousDay = (date: Date): Date => {
  const day = moment(date);
  return day.subtract(1, 'day').endOf('day').toDate();
};

/**
 * Sets a Date object to the beginning of the next day
 * @param date date to reset to beginning of next day
 */
export const setDateToBeginningOfNextDay = (date: Date): Date => {
  const day = moment(date);
  return day.add(1, 'day').startOf('day').toDate();
};

/**
 * Adds a date criteria with the specified start and ned dates to the operatorlist
 */
// tslint:disable: no-unsafe-any no-any
// tslint:disable-next-line: no-unused-expression
export const addDateCriteria = (startDate: Date | undefined, endDate: Date | undefined,
                                propertyName: string, operatorList: any[], useEpoch: boolean = false,
                                preciseTime: boolean = false): void => {

  if (!startDate && !endDate) {
    return;
  }

  const operator: any = {};
  operator[propertyName] = {};

  const addDateToOperator = (dateProcessor: (date: Date) => Date, queryOperator: string, date?: Date): void => {
    if (date) {
      const trimmedDate = dateProcessor(date);
      operator[propertyName][queryOperator] = useEpoch ? trimmedDate.getTime() : trimmedDate;
    }
  };

  if (!preciseTime) {
    // manipulate dates to get the correct range
    addDateToOperator(setDateToEndOfPreviousDay, '$gt', startDate);
    addDateToOperator(setDateToBeginningOfNextDay, '$lt', endDate);
  }
  else {
    // use range provided by the query, no-op processor
    const processor = ((date: Date) => date);
    addDateToOperator(processor, '$gte', startDate);
    addDateToOperator(processor, '$lte', endDate);
  }

  if (Object.keys(operator[propertyName]).length > 0) {
    operatorList.push(operator);
  }
};

/**
 * Creates a list of operators from simple property equals criteria. Excludes array and date properties.
 * @param searchCriteria the search criteria to use for the operator list.
 */
export function createSimpleCriteriaOperatorList(
  searchCriteria: IPatientSearch): any[] {

  const simpleEqualCriteria = (key: string): boolean => !(searchCriteria[key] instanceof Date)
  && !(searchCriteria[key] instanceof Array);

  const createOperator = (key: string): ISearchCriteriaFragment => {
    const frag: ISearchCriteriaFragment = {};
    frag[key] = searchCriteria[key];
    return frag;
  };

  const operatorList: any[] = Object.keys(searchCriteria)
  .filter(simpleEqualCriteria)
  .map(createOperator);
  return operatorList;
}

/**
 * Adds an epoch criteria with the specified start and ned dates to the operatorlist
 */
// tslint:disable: no-unsafe-any no-any
// tslint:disable-next-line: no-unused-expression
export const addEpochCriteria = (startDate: Date | undefined, endDate: Date | undefined,
                                 propertyName: string, operatorList: any[]): void =>
                                 // tslint:disable-next-line: no-void-expression
                                 addDateCriteria(startDate, endDate, propertyName, operatorList, true);

/**
 * Adds an epoch criteria with the specified start and ned dates to the operatorlist.
 * This epoch search is precise, meaning that is not subject to the setBeginningOfNextDay and
 * setEndOfPreviousDay manipulations to normal date searches.
 */
// tslint:disable: no-unsafe-any no-any
// tslint:disable-next-line: no-unused-expression
export const addPreciseDateCriteria = (startDate: Date | undefined, endDate: Date | undefined,
                                       propertyName: string, operatorList: any[]): void =>
  // tslint:disable-next-line: no-void-expression
  addDateCriteria(startDate, endDate, propertyName, operatorList, false, true);

  // tslint:disable-next-line: completed-docs
export const convertStringPropertyToDate = (
  searchCriteria: any,
  datePropertyNames: string[]): void => {

  datePropertyNames.forEach(propertyName => {
    if (searchCriteria[propertyName] !== undefined && !(searchCriteria[propertyName] instanceof Date)) {
      searchCriteria[propertyName] = new Date(searchCriteria[propertyName] as string);
    }
  });
};

// tslint:disable-next-line:completed-docs
export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

/**
 * Sleep for a while
 * https://stackoverflow.com/questions/37764665/typescript-sleep
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
