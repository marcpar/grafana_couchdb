import defaults from 'lodash/defaults'
import { getBackendSrv } from '@grafana/runtime'

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType
} from '@grafana/data'

import { CouchQuery, CouchdbOptions, defaultQuery, Database, DesignDoc, View } from './types'
//import { dataError } from '@grafana/data/types/panelEvents'
//import { DataSourceHttpSettings } from '@grafana/ui'

export class DataSource extends DataSourceApi<CouchQuery, CouchdbOptions> {
  url: string
  withCredentials: boolean
  headers: any
  fields: any[]

  constructor(instanceSettings: DataSourceInstanceSettings<CouchdbOptions>) {
    super(instanceSettings)

    this.url = instanceSettings.url === undefined ? '12' : instanceSettings.url

    this.withCredentials = instanceSettings.withCredentials !== undefined
    this.headers = { 'Content-Type': 'application/json' }
    this.fields = []
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth
    }
  }

  // async doRequest(query: MyQuery) {
  //   const result = await getBackendSrv().datasourceRequest({
  //     method: 'GET',
  //     url: 'https://api.example.com/metrics',
  //     params: query,
  //   });

  //   return result;
  // }

  async doRequest(path: string, options: any) {
    options.withCredentials = this.withCredentials
    options.headers = this.headers
    options.method = typeof options.method === 'undefined' ? 'GET' : options.method
    options.url = path === '' ? this.url : this.url + path

    const result = await getBackendSrv().datasourceRequest(options)
    return result
  }

  async getViewLastPage(database: string, designDoc: string, view: string, limit: number) {
    const response = await this.doRequest(`/${database}/${designDoc}/_view/${view}?limit=0`, {})
    if (response.status !== 200) {
      throw new Error('Getting view count failed.')
    }
    const skip = response.data.total_rows - limit
    return skip < 0 ? `skip=0&limit=${limit}` : `skip=${skip}&limit=${limit}`
  }

  async getGraph(database: string, designDoc: string, view: string, from: number, path?: string) {
    const to = +new Date()
    const limit = Math.floor((to - from) / 1000)
    const lastPage = await this.getViewLastPage(database, designDoc, view, limit)
    const url = `/${database}/${designDoc}/_view/${view}?${lastPage}`
    return this.doRequest(typeof path === 'undefined' ? url : `${url}&${path}`, {})
  }

  async query(options: DataQueryRequest<CouchQuery>): Promise<DataQueryResponse> {
    const data = await Promise.all(
      options.targets.map(
        async (target): Promise<any> => {
          const _undefined =
            typeof target.database === 'undefined' ||
            typeof target.designDoc === 'undefined' ||
            typeof target.view === 'undefined'
          if (_undefined) {
            return { fields: [], length: 0 }
          }
          const database = target.database.value
          const designDoc = target.designDoc.value
          const view = target.view.value
          const from = Date.parse(options.range.from.toString())
          const query = defaults(target, defaultQuery)
          const response = await this.getGraph(database, designDoc, view, from, query.path)
          const frame = new MutableDataFrame({
            refId: query.refId,
            fields: [{ name: 'time', type: FieldType.time }]
          })
          let fields: any = {}
          for (const key in query.fields) {
            frame.addField({ name: query.fields[key].value, type: FieldType.number })
          }
          this.fields = []
          for (let i = response.data.rows.length - 1; i >= 0; i--) {
            const time = response.data.rows[i].key
            for (let _key in response.data.rows[i].value) {
              const value = response.data.rows[i].value[_key]
              if (_key === 'time' || typeof value !== 'number') {
                continue
              }
              let data: any = { time: time }
              data[_key] = value
              if (typeof fields[_key] === 'undefined') {
                fields[_key] = true
                this.fields.push({ label: _key, value: _key })
              }
              frame.add(data)
            }
          }
          return frame
        }
      )
    )

    return {
      data
    }
  }

  async testDatasource() {
    this.doRequest('', {
      url: this.url,
      method: 'GET'
    })
      .then(response => {
        if (response.status === 200) {
          return { status: 'success', message: 'Data source is working', title: 'Success' }
        }

        return {
          status: 'error',
          message: `Data source is not working: ${response.message}`,
          title: 'Error'
        }
      })
      .catch(() => {})
  }

  async findDatabases(): Promise<Database[]> {
    let database: Database[] = []

    return new Promise((resolve, regject) => {
      this.doRequest('/_all_dbs', {
        url: this.url,
        method: 'GET'
      })
        .then(body => {
          body.data.forEach((value: string) => {
            database.push({ label: value, value: value })
          })

          return resolve(database)
        })
        .catch(error => {
          console.error(error)
        })
    })
  }

  async findDesignDocs(database: Database): Promise<DesignDoc[]> {
    let designDocs: DesignDoc[] = []

    return new Promise((resolve, regject) => {
      this.doRequest(`/${database.value}/_design_docs`, {
        url: this.url,
        method: 'GET'
      })
        .then(body => {
          body.data.rows.forEach((value: any) => {
            designDocs.push({ label: value.id, value: value.id })
          })

          return resolve(designDocs)
        })
        .catch(error => {
          console.error(error)
        })
    })
  }

  async findViews(database: Database, viewDoc: DesignDoc): Promise<View[]> {
    let views: View[] = []

    return new Promise((resolve, regject) => {
      this.doRequest(`/${database.value}/${viewDoc.value}`, {
        url: this.url,
        method: 'GET'
      })
        .then(body => {
          Object.keys(body.data.views).forEach((value: any) => {
            views.push({ label: value, value: value })
          })
          return resolve(views)
        })
        .catch(error => {
          console.error(error)
        })
    })
  }
}
