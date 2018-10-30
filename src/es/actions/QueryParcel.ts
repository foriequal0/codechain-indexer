import { ParcelDoc } from "codechain-indexer-types/lib/types";
import { H256 } from "codechain-sdk/lib/core/classes";
import { Client, CountResponse, SearchResponse } from "elasticsearch";
import * as _ from "lodash";
import { ElasticSearchAgent } from "..";
import { BaseAction } from "./BaseAction";

export class QueryParcel implements BaseAction {
    public agent!: ElasticSearchAgent;
    public client!: Client;
    public async getParcel(hash: H256): Promise<ParcelDoc | null> {
        const response = await this.searchParcel({
            sort: [{ blockNumber: { order: "desc" } }, { parcelIndex: { order: "desc" } }],
            size: 1,
            query: {
                bool: {
                    must: [{ term: { isRetracted: false } }, { term: { hash: hash.value } }]
                }
            }
        });
        if (response.hits.total === 0) {
            return null;
        }
        return response.hits.hits[0]._source;
    }

    public async getParcels(
        params?: {
            lastBlockNumber?: number | null;
            lastParcelIndex?: number | null;
            itemsPerPage?: number | null;
        } | null
    ): Promise<ParcelDoc[]> {
        const response = await this.searchParcel({
            sort: [{ blockNumber: { order: "desc" } }, { parcelIndex: { order: "desc" } }],
            search_after: [
                (params && params.lastBlockNumber) || Number.MAX_VALUE,
                (params && params.lastParcelIndex) || Number.MAX_VALUE
            ],
            size: (params && params.itemsPerPage) || 25,
            query: {
                bool: {
                    must: [{ term: { isRetracted: false } }]
                }
            }
        });
        return _.map(response.hits.hits, hit => hit._source);
    }

    public async getTotalParcelCount(): Promise<number> {
        const count = await this.countParcel({
            query: {
                term: { isRetracted: false }
            }
        });
        return count.count;
    }

    public async getParcelsByPlatformAddress(
        address: string,
        params?: {
            page?: number | null;
            itemsPerPage?: number | null;
        } | null
    ): Promise<ParcelDoc[]> {
        const response = await this.searchParcel({
            sort: [{ blockNumber: { order: "desc" } }, { parcelIndex: { order: "desc" } }],
            from: (((params && params.page) || 1) - 1) * ((params && params.itemsPerPage) || 6),
            size: (params && params.itemsPerPage) || 6,
            query: {
                bool: {
                    must: [
                        { term: { isRetracted: false } },
                        {
                            bool: {
                                should: [{ term: { signer: address } }, { term: { "action.receiver": address } }]
                            }
                        }
                    ]
                }
            }
        });
        return _.map(response.hits.hits, hit => hit._source);
    }

    public async getTotalParcelCountByPlatformAddress(address: string): Promise<number> {
        const count = await this.countParcel({
            query: {
                bool: {
                    must: [
                        { term: { isRetracted: false } },
                        {
                            bool: {
                                should: [{ term: { signer: address } }, { term: { "action.receiver": address } }]
                            }
                        }
                    ]
                }
            }
        });
        return count.count;
    }

    public async searchParcel(body: any): Promise<SearchResponse<any>> {
        return this.client.search({
            index: "parcel",
            type: "_doc",
            body
        });
    }

    public async retractParcel(parcelHash: H256): Promise<void> {
        return this.updateParcel(parcelHash, { isRetracted: true });
    }

    public async indexParcel(parcelDoc: ParcelDoc): Promise<any> {
        return this.client.index({
            index: "parcel",
            type: "_doc",
            id: parcelDoc.hash,
            body: parcelDoc
        });
    }

    public async updateParcel(hash: H256, partial: any): Promise<any> {
        return this.client.update({
            index: "parcel",
            type: "_doc",
            id: hash.value,
            body: {
                doc: partial
            }
        });
    }

    public async countParcel(body: any): Promise<CountResponse> {
        return this.client.count({
            index: "parcel",
            type: "_doc",
            body
        });
    }
}