import { DataSourcePlugin } from '@grafana/data'
import { DataSource } from './datasource'
import { ConfigEditor } from './ConfigEditor'
import { QueryEditor } from './QueryEditor'
import { CouchQuery, CouchdbOptions } from './types'

// prettier-ignore
export const plugin = new DataSourcePlugin<DataSource, CouchQuery, CouchdbOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
