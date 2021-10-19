import defaults from 'lodash/defaults'

//import { Format } from './format'

import React, { ChangeEvent, PureComponent } from 'react'
import { LegacyForms, InlineFormLabel, MultiSelect } from '@grafana/ui'
//import { QueryEditorProps, stringToJsRegex } from '@grafana/data'
import { QueryEditorProps } from '@grafana/data'
import { DataSource } from './datasource'
import { defaultQuery, CouchdbOptions, CouchQuery, Database, DesignDoc, View, Fields } from './types'

const { FormField, Select } = LegacyForms

type Props = QueryEditorProps<DataSource, CouchQuery, CouchdbOptions>
interface State {
  query: Partial<CouchQuery>
  databases: Database[]
  designDocs: DesignDoc[]
  views: View[]
}

export class QueryEditor extends PureComponent<Props, State> {
  constructor(props: any) {
    super(props)

    this.state = {
      query: this.props.query,
      databases: [],
      designDocs: [],
      views: []
    }
  }

  async componentDidMount() {
    const databases = await this.props.datasource.findDatabases()
    this.setState({ databases })
    this.getDesignDocumentList()
  }

  async getDesignDocumentList() {
    const { query, datasource } = this.props
    this.setState({
      designDocs: typeof query.database?.value !== 'undefined' ? await datasource.findDesignDocs(query.database) : []
    })
    this.getViewList()
  }

  async getViewList() {
    const { query, datasource } = this.props
    const isUndefined = typeof query.designDoc?.value !== 'undefined' && typeof query.database?.value !== 'undefined'
    this.setState({
      views: isUndefined ? await datasource.findViews(query.database, query.designDoc) : []
    })
    this.onQueryChange(query)
  }

  onQueryChange = (query: Partial<CouchQuery>) => {
    this.setState(() => {
      return { query }
    })
  }

  onPathChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props
    onChange({ ...query, path: event.target.value })
    this.onQueryChange(query)
  }

  onDatabaseChange = (database: Database) => {
    if (this.props.query.database !== database) {
      this.props.query.database = database
      this.props.query.designDoc = null
      this.props.query.view = null
      const { onChange, query } = this.props
      onChange({ ...query, database })
      this.getDesignDocumentList()
    }
  }

  onDesignDocChange = (designDoc: DesignDoc) => {
    if (this.props.query.designDoc !== designDoc) {
      this.props.query.designDoc = designDoc
      this.props.query.view = null
      const { onChange, query } = this.props
      onChange({ ...query, designDoc })
      this.getViewList()
    }
  }

  onViewChange = (view: View) => {
    const { onChange, query, onRunQuery } = this.props
    onChange({ ...query, view })
    onRunQuery()
    query.view = view
    this.onQueryChange(query)
  }

  onFieldChange = (fields: Fields[]) => {
    const { onChange, query, onRunQuery } = this.props
    onChange({ ...query, fields })
    onRunQuery()
    query.fields = fields
    this.onQueryChange(query)
  }

  async onChangeViewOption(view: View) {}

  render() {
    const query = defaults(this.props.query, defaultQuery)
    const { path } = query

    return (
      <>
        <div className="gf-form">
          <InlineFormLabel width="auto">Database </InlineFormLabel>
          <Select
            options={this.state.databases}
            placeholder="Select database"
            onChange={this.onDatabaseChange}
            value={this.state.query.database}
          />
        </div>
        <div className="gf-form">
          <InlineFormLabel width="auto">Design Document </InlineFormLabel>
          <Select
            placeholder="Select Design Docs"
            options={this.state.designDocs}
            value={this.state.query.designDoc}
            onChange={this.onDesignDocChange}
          />
          <InlineFormLabel width="auto">View</InlineFormLabel>
          <Select
            placeholder="Select View"
            options={this.state.views}
            value={this.state.query.view}
            onChange={this.onViewChange}
          />
        </div>
        <div className="gf-form">
          <FormField width={4} value={path} onChange={this.onPathChange} label="URI path" type="text" />
        </div>
        <div className="gf-form">
          <InlineFormLabel width="auto">Fields</InlineFormLabel>
          <MultiSelect
            placeholder="Select fields"
            options={this.props.datasource.fields}
            value={this.state.query.fields}
            onChange={this.onFieldChange}
          />
        </div>
      </>
    )
  }
}
