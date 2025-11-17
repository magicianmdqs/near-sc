import { useEffect, useState } from 'react';
import { Cards } from '@/components/cards';
import styles from '@/styles/app.module.css';
import { HelloNearContract } from '@/config';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

interface WalletSelectorHook {
    signedAccountId: string | null;
    viewFunction: (params: { contractId: string; method: string; args?: Record<string, unknown> }) => Promise<any>;
    callFunction: (params: { contractId: string; method: string; args?: Record<string, unknown>; deposit?: string; gas?: string }) => Promise<any>;
}

const CONTRACT = HelloNearContract as string;

// NEAR <-> yocto utils
const toYocto = (near: string) => {
    if (!near) return "0";
    return BigInt(Math.floor(parseFloat(near) * 1e24)).toString();
};

const safe = (v: any) => (typeof v === "object" ? JSON.stringify(v) : String(v));

interface ContractFunction {
    name: string;
    description: string;
    params?: { name: string; type: string }[];
    isWrite?: boolean;
    call: (args?: Record<string, any>) => Promise<void>;
}

export default function HelloNearExtended() {
    const { signedAccountId, viewFunction, callFunction } =
        useWalletSelector() as WalletSelectorHook;

    const [loggedIn, setLoggedIn] = useState(false);
    const [expandedFn, setExpandedFn] = useState<string | null>(null);
    const [inputs, setInputs] = useState<Record<string, any>>({});
    const [results, setResults] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setLoggedIn(!!signedAccountId);
    }, [signedAccountId]);

    const handleInputChange = (fnName: string, param: string, value: any) => {
        setInputs((prev) => ({
            ...prev,
            [fnName]: { ...prev[fnName], [param]: value }
        }));
    };

    const wrapFunction =
        (fnName: string, fn: any, isWrite = false) =>
            async (args?: any) => {
                setLoading((p) => ({ ...p, [fnName]: true }));
                try {
                    let result;

                    if (isWrite) {
                        const { attachedDeposit, gas, ...restArgs } = args || {};

                        result = await callFunction({
                            contractId: CONTRACT,
                            method: fnName,
                            args: restArgs,
                            deposit: attachedDeposit ? toYocto(attachedDeposit) : undefined,
                            gas: gas ? gas : undefined
                        });
                    } else {
                        result = await viewFunction({
                            contractId: CONTRACT,
                            method: fnName,
                            args
                        });
                    }

                    setResults((p) => ({ ...p, [fnName]: safe(result) }));
                } catch (e) {
                    console.error(e);
                    setResults((p) => ({ ...p, [fnName]: "Error executing " + fnName }));
                } finally {
                    setLoading((p) => ({ ...p, [fnName]: false }));
                }
            };

    const contractFunctions: ContractFunction[] = [
        { name: "contract_source_metadata", description: "Contract metadata", call: wrapFunction("contract_source_metadata", viewFunction) },

        { name: "ft_balance_of", description: "Balance of account", params: [{ name: "account_id", type: "string" }], call: wrapFunction("ft_balance_of", viewFunction) },

        { name: "ft_metadata", description: "FT metadata", call: wrapFunction("ft_metadata", viewFunction) },
        { name: "ft_total_supply", description: "Total supply", call: wrapFunction("ft_total_supply", viewFunction) },

        // --- WRITE FUNCTIONS ---
        {
            name: "ft_transfer",
            description: "Transfer tokens",
            params: [
                { name: "receiver_id", type: "string" },
                { name: "amount", type: "string" }
            ],
            isWrite: true,
            call: wrapFunction("ft_transfer", callFunction, true)
        },

        {
            name: "ft_transfer_call",
            description: "Transfer tokens + call",
            params: [
                { name: "receiver_id", type: "string" },
                { name: "amount", type: "string" },
                { name: "msg", type: "string" }
            ],
            isWrite: true,
            call: wrapFunction("ft_transfer_call", callFunction, true)
        },
        {
            name: "ft_burn",
            description: "Transfer tokens to null address",
            params: [
                { name: "amount", type: "string" },
            ],
            isWrite: true,
            call: wrapFunction("ft_burn", callFunction, true)
        },

        {
            name: "mint_owner",
            description: "Mint tokens (owner)",
            params: [{ name: "amount", type: "string" }],
            isWrite: true,
            call: wrapFunction("mint_owner", callFunction, true)
        },

        {
            name: "deposit",
            description: "Deposit FT",
            isWrite: true,
            call: wrapFunction("deposit", callFunction, true)
        },

        { name: "new", description: "Init contract", isWrite: true, call: wrapFunction("new", callFunction, true) },
        { name: "new_default_meta", description: "Init with default metadata", isWrite: true, call: wrapFunction("new_default_meta", callFunction, true) },

        // --- STORAGE FUNCTIONS ---
        { name: "storage_balance_bounds", description: "Storage bounds", call: wrapFunction("storage_balance_bounds", viewFunction) },

        {
            name: "storage_balance_of",
            description: "Storage balance",
            params: [{ name: "account_id", type: "string" }],
            call: wrapFunction("storage_balance_of", viewFunction)
        },

        {
            name: "storage_deposit",
            description: "Register storage",
            params: [{ name: "account_id", type: "string" }],
            isWrite: true,
            call: wrapFunction("storage_deposit", callFunction, true)
        },

        {
            name: "storage_unregister",
            description: "Unregister storage",
            isWrite: true,
            call: wrapFunction("storage_unregister", callFunction, true)
        },

        {
            name: "storage_withdraw",
            description: "Withdraw storage",
            params: [{ name: "amount", type: "string" }],
            isWrite: true,
            call: wrapFunction("storage_withdraw", callFunction, true)
        }
    ];

    return (
        <main className={styles.main}>
            <div className={styles.description}>
                <p>
                    Interacting with contract:{" "}
                    <code className={styles.code}>{CONTRACT}</code>
                </p>
            </div>

            <div className="d-flex w-100 gap-3 p-3">
                <div className="function-list">
                    <ul className="function-list-ul">
                        {contractFunctions.map((fn) => (
                            <li
                                key={fn.name}
                                className={`function-list-item ${
                                    expandedFn === fn.name ? "active" : ""
                                }`}
                                onClick={() =>
                                    setExpandedFn(
                                        expandedFn === fn.name ? null : fn.name
                                    )
                                }
                            >
                                {fn.name}
                                <i
                                    className={`bi ${
                                        expandedFn === fn.name
                                            ? "bi-chevron-down"
                                            : "bi-chevron-right"
                                    }`}
                                ></i>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex-grow-1 d-flex flex-column">
                    {contractFunctions.map(
                        (fn) =>
                            expandedFn === fn.name && (
                                <div key={fn.name} className="function-detail-card">
                                    <p className="mb-2 fw-bold">{fn.description}</p>

                                    {/* param inputs */}
                                    {fn.params?.map((p) => (
                                        <div key={p.name} className="mb-2">
                                            <label className="form-label small">
                                                {p.name} ({p.type})
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={inputs[fn.name]?.[p.name] || ""}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        fn.name,
                                                        p.name,
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    ))}

                                    {/* write-only fields (deposit, gas) */}
                                    {fn.isWrite && (
                                        <div className="mb-2">
                                            <label className="form-label small">
                                                Attached Deposit (NEAR)
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={
                                                    inputs[fn.name]?.attachedDeposit || ""
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        fn.name,
                                                        "attachedDeposit",
                                                        e.target.value
                                                    )
                                                }
                                            />

                                            <label className="form-label small">
                                                Gas (optional)
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={inputs[fn.name]?.gas || ""}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        fn.name,
                                                        "gas",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    )}

                                    <button
                                        className="btn btn-call btn-sm"
                                        disabled={!loggedIn || loading[fn.name]}
                                        onClick={() => fn.call(inputs[fn.name])}
                                    >
                                        {loading[fn.name] ? (
                                            <i className="spinner-border spinner-border-sm"></i>
                                        ) : (
                                            "Call"
                                        )}
                                    </button>

                                    {results[fn.name] && (
                                        <div className="mt-2 p-2 border rounded small bg-light text-dark">
                                            Result: {results[fn.name]}
                                        </div>
                                    )}
                                </div>
                            )
                    )}
                </div>
            </div>

            <Cards />
        </main>
    );
}
