import { AssetDoc, AssetSchemeDoc } from "codechain-indexer-types/lib/types";
import { H256 } from "codechain-sdk/lib/core/classes";
import { Client, DeleteDocumentResponse } from "elasticsearch";
import * as _ from "lodash";
import { ElasticSearchAgent } from "..";
import { BaseAction } from "./BaseAction";

export class QueryAsset implements BaseAction {
    public agent!: ElasticSearchAgent;
    public client!: Client;

    public async getUTXOListByAssetType(
        address: string,
        assetType: H256,
        currentBestBlockNumber: number,
        confirmThreshold: number,
        isConfirmed: boolean,
        params?: {
            lastBlockNumber?: number | null;
            lastParcelIndex?: number | null;
            lastTransactionIndex?: number | null;
            itemsPerPage?: number | null;
        } | null
    ): Promise<{ asset: AssetDoc; blockNumber: number; parcelIndex: number; transactionIndex: number }[]> {
        let rangeOption;
        if (isConfirmed) {
            rangeOption = {
                blockNumber: {
                    lte: currentBestBlockNumber - confirmThreshold
                }
            };
        } else {
            rangeOption = {
                blockNumber: {
                    gt: currentBestBlockNumber - confirmThreshold
                }
            };
        }
        const response = await this.client.search<{
            asset: AssetDoc;
            blockNumber: number;
            parcelIndex: number;
            transactionIndex: number;
        }>({
            index: "asset",
            type: "_doc",
            body: {
                sort: [
                    { blockNumber: { order: "desc" } },
                    { parcelIndex: { order: "desc" } },
                    { transactionIndex: { order: "desc" } }
                ],
                size: (params && params.itemsPerPage) || 25,
                search_after: [
                    (params && params.lastBlockNumber) || Number.MAX_VALUE,
                    (params && params.lastParcelIndex) || Number.MAX_VALUE,
                    (params && params.lastTransactionIndex) || Number.MAX_VALUE
                ],
                query: {
                    bool: {
                        must: [
                            {
                                term: {
                                    address: {
                                        value: address
                                    }
                                }
                            },
                            {
                                term: {
                                    "asset.assetType": {
                                        value: assetType
                                    }
                                }
                            },
                            {
                                term: {
                                    isRemoved: {
                                        value: false
                                    }
                                }
                            },
                            {
                                range: rangeOption
                            }
                        ]
                    }
                }
            }
        });
        return _.map(response.hits.hits, hit => {
            return {
                asset: hit._source.asset,
                blockNumber: hit._source.blockNumber,
                parcelIndex: hit._source.parcelIndex,
                transactionIndex: hit._source.transactionIndex
            };
        });
    }

    public async getAggsUTXOList(
        address: string,
        currentBestBlockNumber: number,
        confirmThreshold: number,
        isConfirmed: boolean,
        params?: {
            page?: number | null;
            itemsPerPage?: number | null;
        } | null
    ): Promise<
        {
            assetType: string;
            totalAssetQuantity: number;
            utxoQuantity: number;
        }[]
    > {
        let rangeOption;
        if (isConfirmed) {
            rangeOption = {
                blockNumber: {
                    lte: currentBestBlockNumber - confirmThreshold
                }
            };
        } else {
            rangeOption = {
                blockNumber: {
                    gt: currentBestBlockNumber - confirmThreshold
                }
            };
        }
        const response = await this.client.search<{
            asset: AssetDoc;
            blockNumber: number;
            parcelIndex: number;
            transactionIndex: number;
        }>({
            index: "asset",
            type: "_doc",
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                term: {
                                    address: {
                                        value: address
                                    }
                                }
                            },
                            {
                                term: {
                                    isRemoved: {
                                        value: false
                                    }
                                }
                            },
                            {
                                range: rangeOption
                            }
                        ]
                    }
                },
                size: 0,
                aggs: {
                    asset_bucket: {
                        composite: {
                            sources: [
                                {
                                    type: {
                                        terms: {
                                            field: "asset.assetType"
                                        }
                                    }
                                }
                            ]
                        },
                        aggs: {
                            sum_of_asset: {
                                sum: {
                                    field: "asset.amount"
                                }
                            },
                            asset_bucket_sort: {
                                bucket_sort: {
                                    sort: [
                                        {
                                            sum_of_asset: {
                                                order: "desc"
                                            }
                                        }
                                    ],
                                    from: ((params && params.page) || 0) * ((params && params.itemsPerPage) || 25),
                                    size: (params && params.itemsPerPage) || 25
                                }
                            }
                        }
                    }
                }
            }
        });
        return _.map(response.aggregations.asset_bucket.buckets, bucket => {
            return {
                assetType: bucket.key.type,
                totalAssetQuantity: bucket.sum_of_asset.value,
                utxoQuantity: bucket.doc_count
            };
        });
    }

    public async getAggsUTXOByAssetType(
        address: string,
        assetType: H256,
        currentBestBlockNumber: number,
        confirmThreshold: number,
        isConfirmed: boolean
    ): Promise<
        | {
              assetType: string;
              totalAssetQuantity: number;
              utxoQuantity: number;
          }
        | undefined
    > {
        let rangeOption;
        if (isConfirmed) {
            rangeOption = {
                blockNumber: {
                    lte: currentBestBlockNumber - confirmThreshold
                }
            };
        } else {
            rangeOption = {
                blockNumber: {
                    gt: currentBestBlockNumber - confirmThreshold
                }
            };
        }
        const response = await this.client.search<{
            asset: AssetDoc;
            blockNumber: number;
            parcelIndex: number;
            transactionIndex: number;
        }>({
            index: "asset",
            type: "_doc",
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                term: {
                                    address: {
                                        value: address
                                    }
                                }
                            },
                            {
                                term: {
                                    "asset.assetType": {
                                        value: assetType.value
                                    }
                                }
                            },
                            {
                                term: {
                                    isRemoved: {
                                        value: false
                                    }
                                }
                            },
                            {
                                range: rangeOption
                            }
                        ]
                    }
                },
                size: 0,
                aggs: {
                    asset_bucket: {
                        composite: {
                            sources: [
                                {
                                    type: {
                                        terms: {
                                            field: "asset.assetType"
                                        }
                                    }
                                }
                            ]
                        },
                        aggs: {
                            sum_of_asset: {
                                sum: {
                                    field: "asset.amount"
                                }
                            },
                            asset_bucket_sort: {
                                bucket_sort: {
                                    sort: [
                                        {
                                            sum_of_asset: {
                                                order: "desc"
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        });
        if (response.aggregations.asset_bucket.buckets.length === 0) {
            return undefined;
        }

        const bucket = response.aggregations.asset_bucket.buckets[0];
        return {
            assetType: bucket.key.type,
            totalAssetQuantity: bucket.sum_of_asset.value,
            utxoQuantity: bucket.doc_count
        };
    }

    public async indexAsset(
        address: string,
        assetDoc: AssetDoc,
        blockNumber: number,
        parcelIndex: number,
        transactionIndex: number
    ): Promise<void> {
        return this.client.update({
            index: "asset",
            type: "_doc",
            id: `${address}-${assetDoc.assetType}-${assetDoc.transactionHash}-${assetDoc.transactionOutputIndex}`,
            body: {
                doc: {
                    address,
                    asset: assetDoc,
                    blockNumber,
                    parcelIndex,
                    transactionIndex,
                    isRemoved: false
                },
                doc_as_upsert: true
            },
            refresh: "true"
        });
    }

    public async removeAsset(
        address: string,
        assetType: H256,
        transactionHash: H256,
        transactionOutputIndex: number
    ): Promise<DeleteDocumentResponse> {
        return this.client.update({
            index: "asset",
            type: "_doc",
            id: `${address}-${assetType.value}-${transactionHash.value}-${transactionOutputIndex}`,
            body: {
                doc: {
                    isRemoved: true
                }
            },
            refresh: "true"
        });
    }

    public async revivalAsset(
        address: string,
        assetType: H256,
        transactionHash: H256,
        transactionOutputIndex: number
    ): Promise<DeleteDocumentResponse> {
        return this.client.update({
            index: "asset",
            type: "_doc",
            id: `${address}-${assetType.value}-${transactionHash.value}-${transactionOutputIndex}`,
            body: {
                doc: {
                    isRemoved: false
                }
            },
            refresh: "true"
        });
    }
}