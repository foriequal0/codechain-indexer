import { AssetDoc, TransactionDoc } from "codechain-indexer-types/lib/types";
import { AssetTransferAddress, H256, PlatformAddress } from "codechain-sdk/lib/core/classes";
import { Router } from "express";
import * as _ from "lodash";
import { ServerContext } from "../ServerContext";

function handle(context: ServerContext, router: Router) {
    router.get("/addr-platform-account/:address", async (req, res, next) => {
        const { address } = req.params;
        try {
            PlatformAddress.fromString(address).getAccountId();
        } catch (e) {
            res.send(JSON.stringify(null));
            return;
        }
        try {
            const balance = await context.codechainSdk.rpc.chain.getBalance(address);
            const nonce = await context.codechainSdk.rpc.chain.getNonce(address);
            const account = {
                balance: balance ? balance.value : 0,
                nonce: nonce.value
            };
            res.send(account);
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-platform-blocks/:address", async (req, res, next) => {
        const { address } = req.params;
        const { page, itemsPerPage } = req.query;
        try {
            PlatformAddress.fromString(address).getAccountId();
        } catch (e) {
            res.send(JSON.stringify([]));
            return;
        }
        try {
            const blocks = await context.db.getBlocksByPlatformAddress(address, { page, itemsPerPage });
            res.send(blocks);
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-platform-blocks/:address/totalCount", async (req, res, next) => {
        const { address } = req.params;
        try {
            PlatformAddress.fromString(address).getAccountId();
        } catch (e) {
            res.send(JSON.stringify(0));
            return;
        }
        try {
            const count = await context.db.getTotalBlockCountByPlatformAddress(address);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-platform-parcels/:address", async (req, res, next) => {
        const { address } = req.params;
        const { page, itemsPerPage } = req.query;
        try {
            PlatformAddress.fromString(address).getAccountId();
        } catch (e) {
            res.send(JSON.stringify([]));
            return;
        }
        try {
            const parcels = await context.db.getParcelsByPlatformAddress(address, { page, itemsPerPage });
            res.send(parcels);
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-platform-parcels/:address/totalCount", async (req, res, next) => {
        const { address } = req.params;
        try {
            PlatformAddress.fromString(address).getAccountId();
        } catch (e) {
            res.send(JSON.stringify(0));
            return;
        }
        try {
            const count = await context.db.getTotalParcelCountByPlatformAddress(address);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-platform-assets/:address", async (req, res, next) => {
        const { address } = req.params;
        const { page, itemsPerPage } = req.query;
        try {
            PlatformAddress.fromString(address).getAccountId();
        } catch (e) {
            res.send(JSON.stringify([]));
            return;
        }
        try {
            const assetBundles = await context.db.getAssetBundlesByPlatformAddress(address, { page, itemsPerPage });
            res.send(assetBundles);
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-platform-assets/:address/totalCount", async (req, res, next) => {
        const { address } = req.params;
        try {
            PlatformAddress.fromString(address).getAccountId();
        } catch (e) {
            res.send(JSON.stringify(0));
            return;
        }
        try {
            const count = await context.db.getTotalAssetBundleCountByPlatformAddress(address);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-asset-txs/:address", async (req, res, next) => {
        const { address } = req.params;
        const { page, itemsPerPage } = req.query;
        try {
            AssetTransferAddress.fromString(address);
        } catch (e) {
            res.send([]);
            return;
        }
        try {
            const transactions: TransactionDoc[] = await context.db.getTransactionsByAssetTransferAddress(address, {
                page,
                itemsPerPage
            });
            res.send(transactions);
        } catch (e) {
            next(e);
        }
    });

    router.get("/addr-asset-txs/:address/totalCount", async (req, res, next) => {
        const { address } = req.params;
        try {
            AssetTransferAddress.fromString(address);
        } catch (e) {
            res.send([]);
            return;
        }
        try {
            const count = await context.db.getTotalTxCountByAssetTransferAddress(address);
            res.send(JSON.stringify(count));
        } catch (e) {
            next(e);
        }
    });
}

export const AddressAction = {
    handle
};