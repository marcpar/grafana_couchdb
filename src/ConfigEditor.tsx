import { DataSourcePluginOptionsEditorProps } from '@grafana/data'
import { DataSourceHttpSettings } from '@grafana/ui'
import React from 'react'
import { CouchdbOptions } from './types'

export type Props = DataSourcePluginOptionsEditorProps<CouchdbOptions>

export const ConfigEditor = (props: Props) => {
  const { options, onOptionsChange } = props

  return (
    <>
      <DataSourceHttpSettings
        defaultUrl={'http://localhost:5984'}
        dataSourceConfig={options}
        showAccessOptions={true}
        onChange={onOptionsChange}
      />

      <div></div>
    </>
  )
}
