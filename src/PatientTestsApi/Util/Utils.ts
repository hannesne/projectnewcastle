import moment from "moment";
import { ISearchCriteriaFragment } from "../Models/Search";
import { IPatient, IPatientSearch } from "../Models/IPatient";

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
 * Removes database-only properties from IPatient objects
 * @param obj 
 */
export const removeDatabaseProperties = (obj: IPatient) => {
  // remove database properties
  delete obj._id;
  delete obj._shardKey;
  delete obj._dateOfBirthDate;
};

/**
 * Checks if an object has any properties left that are empty, or null.
 *
 * Taken from https://stackoverflow.com/a/49427583
 */
export const isObjectEmpty = (object: any): boolean =>
  !Object.values(object).some(x => (x !== null && x !== ''));

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
