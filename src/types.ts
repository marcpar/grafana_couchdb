//import { DataQuery, DataQueryRequest, DataSourceJsonData } from '@grafana/data'
import { DataQuery, DataSourceJsonData, SelectableValue } from '@grafana/data'

export interface CouchQuery extends DataQuery {
  adhocFilters?: any[]
  path?: string
  database?: SelectableValue<string> | any
  designDoc?: SelectableValue<string> | any
  view?: SelectableValue<string> | any
  fields?: Array<SelectableValue<string>> | any
}

export const defaultQuery: Partial<CouchQuery> = {}

export interface CouchdbOptions extends DataSourceJsonData {
  database?: string
  viewDocs?: string[]
  designDocs?: string[]
}

export interface Database {
  label?: string
  value?: string
}

export interface DesignDoc {
  label?: string
  value?: string
}

export interface View {
  label?: string
  value?: string
}

export interface Fields {
  label?: string
  value?: string
}

/**
 * These are options configured for each DataSource instance
 */
// export interface MyDataSourceOptions extends DataSourceJsonData {
//   url?: string;
//   username?: string;

// }

// /**
//  * Value that is used in the backend, but never sent over HTTP to the frontend
//  */
// export interface MySecureJsonData {
//   password?: string;
// }
