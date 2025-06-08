/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/transactions/route";
exports.ids = ["app/api/transactions/route"];
exports.modules = {

/***/ "(rsc)/./app/api/transactions/route.ts":
/*!***************************************!*\
  !*** ./app/api/transactions/route.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _neynar_nodejs_sdk__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @neynar/nodejs-sdk */ \"(rsc)/./node_modules/@neynar/nodejs-sdk/build/index.js\");\n/* harmony import */ var _neynar_nodejs_sdk__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_neynar_nodejs_sdk__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_supabase__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../lib/supabase */ \"(rsc)/./lib/supabase.ts\");\n/* harmony import */ var ethers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ethers */ \"(rsc)/./node_modules/ethers/lib.esm/utils/units.js\");\n\n\n\n\n// 初始化 Neynar 客户端\nif (!process.env.NEYNAR_API_KEY) {\n    throw new Error(\"NEYNAR_API_KEY is not set in .env.local\");\n}\nconst neynarClient = new _neynar_nodejs_sdk__WEBPACK_IMPORTED_MODULE_1__.NeynarAPIClient(new _neynar_nodejs_sdk__WEBPACK_IMPORTED_MODULE_1__.Configuration({\n    apiKey: process.env.NEYNAR_API_KEY\n}));\n// GoldRush API Configuration\nconst GOLDRUSH_API_KEY = process.env.GOLDRUSH_API_KEY;\nconst GOLDRUSH_API_BASE_URL = \"https://api.covalenthq.com/v1\";\n// 解析从 GoldRush API 获取的原始交易数据\nfunction parseTransaction(tx, user) {\n    const fromAddress = tx.from_address.toLowerCase();\n    let sent = null;\n    let received = null;\n    // 安全检查：确保 log_events 是一个可遍历的数组\n    if (tx.log_events && Array.isArray(tx.log_events)) {\n        for (const event of tx.log_events){\n            if (event.decoded?.name === 'Transfer') {\n                const params = event.decoded.params;\n                const transferFrom = params.find((p)=>p.name === 'from')?.value?.toLowerCase();\n                const transferTo = params.find((p)=>p.name === 'to')?.value?.toLowerCase();\n                const value = params.find((p)=>p.name === 'value')?.value;\n                if (!transferFrom || !transferTo || !value) continue;\n                const tokenAmount = ethers__WEBPACK_IMPORTED_MODULE_3__.formatUnits(value, event.sender_contract_decimals || 18);\n                const tokenDetails = {\n                    token: event.sender_contract_ticker_symbol || 'Unknown',\n                    amount: parseFloat(tokenAmount).toLocaleString('en-US', {\n                        maximumFractionDigits: 4\n                    }),\n                    logo: event.sender_logo_url\n                };\n                if (transferFrom === fromAddress && !sent) {\n                    sent = tokenDetails;\n                }\n                if (transferTo === fromAddress && !received) {\n                    received = tokenDetails;\n                }\n            }\n        }\n    }\n    // 根据解析出的 sent 和 received 来确定操作类型\n    let action = 'Other';\n    if (sent && received) {\n        action = 'Swap';\n    } else if (sent) {\n        action = 'Transfer';\n    } else if (tx.log_events && Array.isArray(tx.log_events) && tx.log_events.some((e)=>e.decoded?.name === 'Approval')) {\n        action = 'Approval';\n    }\n    // 对于Swap和Transfer，我们需要它们有价值才展示\n    if ((action === 'Swap' || action === 'Transfer') && (tx.value_quote > 1 || tx.gas_quote > 0.1)) {\n        return {\n            tx_hash: tx.tx_hash,\n            chain: tx.chain_name,\n            timestamp: new Date(tx.block_signed_at).getTime(),\n            user: user,\n            action: action,\n            sent: sent || undefined,\n            received: received || undefined,\n            usd_value: tx.value_quote\n        };\n    }\n    return null;\n}\nconst delay = (ms)=>new Promise((resolve)=>setTimeout(resolve, ms));\n// 帮助函数：从 GoldRush 获取单个地址和链的交易\nasync function fetchTransactionsForChain(address, chainName, user) {\n    if (!GOLDRUSH_API_KEY) return [];\n    const url = `${GOLDRUSH_API_BASE_URL}/${chainName}/address/${address}/transactions_v3/?quote-currency=USD&no-logs=false&page-size=5`;\n    try {\n        const response = await fetch(url, {\n            headers: {\n                'Authorization': `Bearer ${GOLDRUSH_API_KEY}`\n            }\n        });\n        if (!response.ok) {\n            console.error(`GoldRush API error for ${address} on ${chainName}:`, await response.text());\n            return [];\n        }\n        const data = await response.json();\n        if (data.error || !data.data?.items) {\n            // It's common for addresses to have no transactions, so we don't log an error for that.\n            return [];\n        }\n        const parsedTxs = data.data.items.map((tx)=>parseTransaction(tx, user)).filter((tx)=>tx !== null);\n        return parsedTxs;\n    } catch (e) {\n        console.error(`Failed to fetch transactions from GoldRush for ${address} on ${chainName}:`, e);\n        return [];\n    }\n}\nasync function GET(req) {\n    if (!GOLDRUSH_API_KEY) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            message: \"GOLDRUSH_API_KEY is not set\"\n        }, {\n            status: 500\n        });\n    }\n    const { searchParams } = new URL(req.url);\n    const fidParam = searchParams.get('fid');\n    const addressParam = searchParams.get('address');\n    if (!fidParam && !addressParam) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            message: \"fid or address is required\"\n        }, {\n            status: 400\n        });\n    }\n    try {\n        // ---- 分支 1: 按钱包地址查询 ----\n        if (addressParam) {\n            const address = addressParam.toLowerCase();\n            let user = {\n                fid: 0,\n                username: 'unknown',\n                display_name: 'Unknown',\n                pfp_url: ''\n            };\n            // 尝试从数据库中查找与该钱包关联的用户信息\n            const { data: walletData } = await _lib_supabase__WEBPACK_IMPORTED_MODULE_2__.supabase.from('wallets').select('user_fid').eq('address', address).single();\n            if (walletData?.user_fid) {\n                const { data: userData } = await _lib_supabase__WEBPACK_IMPORTED_MODULE_2__.supabase.from('users').select('*').eq('fid', walletData.user_fid).single();\n                if (userData) {\n                    user = {\n                        fid: userData.fid,\n                        username: userData.username,\n                        display_name: userData.display_name,\n                        pfp_url: userData.pfp_url\n                    };\n                }\n            }\n            // 同时查询 eth-mainnet 和 monad-testnet\n            const ethTxs = await fetchTransactionsForChain(address, \"eth-mainnet\", user);\n            const monadTxs = await fetchTransactionsForChain(address, \"monad-testnet\", user);\n            const transactions = [\n                ...ethTxs,\n                ...monadTxs\n            ];\n            transactions.sort((a, b)=>b.timestamp - a.timestamp);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(transactions);\n        }\n        // ---- 分支 2: 按 FID 查询 ----\n        if (fidParam) {\n            const stream = new ReadableStream({\n                async start (controller) {\n                    const encoder = new TextEncoder();\n                    const pushEvent = (event, data)=>{\n                        controller.enqueue(encoder.encode(`event: ${event}\\n`));\n                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\\n\\n`));\n                    };\n                    try {\n                        const fid = parseInt(fidParam);\n                        let cursor = null;\n                        let aFollowingFound = false;\n                        do {\n                            // 1. 按页获取关注者\n                            const response = await neynarClient.fetchUserFollowing({\n                                fid,\n                                limit: 100,\n                                cursor: cursor ?? undefined\n                            });\n                            const followingBatch = response.users;\n                            cursor = response.next.cursor;\n                            if (followingBatch.length > 0) {\n                                aFollowingFound = true;\n                                const followingFids = followingBatch.map((item)=>item.user.fid);\n                                const userMap = new Map(followingBatch.map((item)=>[\n                                        item.user.fid,\n                                        item.user\n                                    ]));\n                                // 2. 获取该批次关注者的钱包\n                                const { data: wallets, error: dbError } = await _lib_supabase__WEBPACK_IMPORTED_MODULE_2__.supabase.from('wallets').select('user_fid, address').in('user_fid', followingFids);\n                                if (dbError) {\n                                    console.error(\"Supabase error fetching wallets for a batch:\", dbError);\n                                    continue; // 跳过此批次\n                                }\n                                const evmWallets = wallets ? wallets.filter((w)=>w.address.startsWith('0x')) : [];\n                                // 3. 为该批次的每个钱包获取交易并立即推送\n                                for (const wallet of evmWallets){\n                                    const user = userMap.get(wallet.user_fid);\n                                    if (!user) continue;\n                                    const ethTxs = await fetchTransactionsForChain(wallet.address, \"eth-mainnet\", user);\n                                    const monadTxs = await fetchTransactionsForChain(wallet.address, \"monad-testnet\", user);\n                                    const transactions = [\n                                        ...ethTxs,\n                                        ...monadTxs\n                                    ];\n                                    if (transactions.length > 0) {\n                                        pushEvent('transaction', transactions);\n                                    }\n                                    await delay(250); // 增加延时以避免API限速\n                                }\n                            }\n                        }while (cursor); // 4. 如果有下一页，则继续循环\n                        if (!aFollowingFound) {\n                            pushEvent('done', {\n                                message: 'No one followed.'\n                            });\n                        } else {\n                            pushEvent('done', {\n                                message: 'Stream completed'\n                            });\n                        }\n                    } catch (error) {\n                        console.error(\"Streaming error:\", error);\n                        const errorMessage = error.message || 'An unknown error occurred';\n                        pushEvent('error', {\n                            message: \"Streaming failed\",\n                            error: errorMessage\n                        });\n                    } finally{\n                        controller.close();\n                    }\n                }\n            });\n            return new Response(stream, {\n                headers: {\n                    'Content-Type': 'text/event-stream',\n                    'Cache-Control': 'no-cache',\n                    'Connection': 'keep-alive'\n                }\n            });\n        }\n    } catch (error) {\n        console.error(\"Failed to fetch transactions:\", error);\n        const errorMessage = error.message || 'An unknown error occurred';\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            message: \"Failed to fetch transactions\",\n            error: errorMessage\n        }, {\n            status: 500\n        });\n    }\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        message: \"Invalid request\"\n    }, {\n        status: 400\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFlVjtvQ0FDM0I7b0NBQ0EsTUFBTTVDLE1BQU0sTUFBTSxlQUFlO2dDQUNuQzs0QkFDRjt3QkFDRixRQUFTNEQsUUFBUSxDQUFDLGtCQUFrQjt3QkFFcEMsSUFBSSxDQUFDQyxpQkFBaUI7NEJBQ3BCUCxVQUFVLFFBQVE7Z0NBQUU5QixTQUFTOzRCQUFtQjt3QkFDbEQsT0FBTzs0QkFDTDhCLFVBQVUsUUFBUTtnQ0FBRTlCLFNBQVM7NEJBQW1CO3dCQUNsRDtvQkFDRixFQUFFLE9BQU9WLE9BQU87d0JBQ2RELFFBQVFDLEtBQUssQ0FBQyxvQkFBb0JBO3dCQUNsQyxNQUFNaUUsZUFBZSxNQUFldkQsT0FBTyxJQUFJO3dCQUMvQzhCLFVBQVUsU0FBUzs0QkFBRTlCLFNBQVM7NEJBQW9CVixPQUFPaUU7d0JBQWE7b0JBQ3hFLFNBQVU7d0JBQ1I1QixXQUFXNkIsS0FBSztvQkFDbEI7Z0JBQ0Y7WUFDRjtZQUVBLE9BQU8sSUFBSUMsU0FBU2pDLFFBQVE7Z0JBQzFCckMsU0FBUztvQkFDUCxnQkFBZ0I7b0JBQ2hCLGlCQUFpQjtvQkFDakIsY0FBYztnQkFDaEI7WUFDRjtRQUNGO0lBRUYsRUFBRSxPQUFPRyxPQUFPO1FBQ2RELFFBQVFDLEtBQUssQ0FBQyxpQ0FBaUNBO1FBQy9DLE1BQU1pRSxlQUFlLE1BQWV2RCxPQUFPLElBQUk7UUFDL0MsT0FBT25GLHFEQUFZQSxDQUFDNEUsSUFBSSxDQUFDO1lBQUVPLFNBQVM7WUFBZ0NWLE9BQU9pRTtRQUFhLEdBQUc7WUFBRXRELFFBQVE7UUFBSTtJQUMzRztJQUVBLE9BQU9wRixxREFBWUEsQ0FBQzRFLElBQUksQ0FBQztRQUFFTyxTQUFTO0lBQWtCLEdBQUc7UUFBRUMsUUFBUTtJQUFJO0FBQ3pFIiwic291cmNlcyI6WyIvVXNlcnMvYXJ2aW4vRG9jdW1lbnRzL1dvcmsgTG9jYWwvVGhlIENvbXBhbnkgTG9jYWwvRXh0ZXJuYWwvU2lnbmFsQ2FzdC9hcHAvYXBpL3RyYW5zYWN0aW9ucy9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVxdWVzdCwgTmV4dFJlc3BvbnNlIH0gZnJvbSBcIm5leHQvc2VydmVyXCI7XG5pbXBvcnQgeyBOZXluYXJBUElDbGllbnQsIENvbmZpZ3VyYXRpb24gfSBmcm9tIFwiQG5leW5hci9ub2RlanMtc2RrXCI7XG5pbXBvcnQgeyBzdXBhYmFzZSB9IGZyb20gXCIuLi8uLi8uLi9saWIvc3VwYWJhc2VcIjtcbmltcG9ydCB7IGV0aGVycyB9IGZyb20gXCJldGhlcnNcIjtcbmltcG9ydCB7IFNpbXBsaWZpZWRUcmFuc2FjdGlvbiB9IGZyb20gXCIuLi8uLi8uLi9saWIvdHlwZXNcIjtcblxuLy8g5Yid5aeL5YyWIE5leW5hciDlrqLmiLfnq69cbmlmICghcHJvY2Vzcy5lbnYuTkVZTkFSX0FQSV9LRVkpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiTkVZTkFSX0FQSV9LRVkgaXMgbm90IHNldCBpbiAuZW52LmxvY2FsXCIpO1xufVxuY29uc3QgbmV5bmFyQ2xpZW50ID0gbmV3IE5leW5hckFQSUNsaWVudChuZXcgQ29uZmlndXJhdGlvbih7XG4gICAgYXBpS2V5OiBwcm9jZXNzLmVudi5ORVlOQVJfQVBJX0tFWSxcbn0pKTtcblxuLy8gR29sZFJ1c2ggQVBJIENvbmZpZ3VyYXRpb25cbmNvbnN0IEdPTERSVVNIX0FQSV9LRVkgPSBwcm9jZXNzLmVudi5HT0xEUlVTSF9BUElfS0VZO1xuY29uc3QgR09MRFJVU0hfQVBJX0JBU0VfVVJMID0gXCJodHRwczovL2FwaS5jb3ZhbGVudGhxLmNvbS92MVwiO1xuXG4vLyDop6PmnpDku44gR29sZFJ1c2ggQVBJIOiOt+WPlueahOWOn+Wni+S6pOaYk+aVsOaNrlxuZnVuY3Rpb24gcGFyc2VUcmFuc2FjdGlvbih0eDogYW55LCB1c2VyOiBhbnkpOiBTaW1wbGlmaWVkVHJhbnNhY3Rpb24gfCBudWxsIHtcbiAgY29uc3QgZnJvbUFkZHJlc3MgPSB0eC5mcm9tX2FkZHJlc3MudG9Mb3dlckNhc2UoKTtcbiAgbGV0IHNlbnQgPSBudWxsO1xuICBsZXQgcmVjZWl2ZWQgPSBudWxsO1xuXG4gIC8vIOWuieWFqOajgOafpe+8muehruS/nSBsb2dfZXZlbnRzIOaYr+S4gOS4quWPr+mBjeWOhueahOaVsOe7hFxuICBpZiAodHgubG9nX2V2ZW50cyAmJiBBcnJheS5pc0FycmF5KHR4LmxvZ19ldmVudHMpKSB7XG4gICAgZm9yIChjb25zdCBldmVudCBvZiB0eC5sb2dfZXZlbnRzKSB7XG4gICAgICBpZiAoZXZlbnQuZGVjb2RlZD8ubmFtZSA9PT0gJ1RyYW5zZmVyJykge1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBldmVudC5kZWNvZGVkLnBhcmFtcztcbiAgICAgICAgY29uc3QgdHJhbnNmZXJGcm9tID0gcGFyYW1zLmZpbmQoKHA6IGFueSkgPT4gcC5uYW1lID09PSAnZnJvbScpPy52YWx1ZT8udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29uc3QgdHJhbnNmZXJUbyA9IHBhcmFtcy5maW5kKChwOiBhbnkpID0+IHAubmFtZSA9PT0gJ3RvJyk/LnZhbHVlPy50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcmFtcy5maW5kKChwOiBhbnkpID0+IHAubmFtZSA9PT0gJ3ZhbHVlJyk/LnZhbHVlO1xuXG4gICAgICAgIGlmICghdHJhbnNmZXJGcm9tIHx8ICF0cmFuc2ZlclRvIHx8ICF2YWx1ZSkgY29udGludWU7XG5cbiAgICAgICAgY29uc3QgdG9rZW5BbW91bnQgPSBldGhlcnMuZm9ybWF0VW5pdHModmFsdWUsIGV2ZW50LnNlbmRlcl9jb250cmFjdF9kZWNpbWFscyB8fCAxOCk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCB0b2tlbkRldGFpbHMgPSB7XG4gICAgICAgICAgdG9rZW46IGV2ZW50LnNlbmRlcl9jb250cmFjdF90aWNrZXJfc3ltYm9sIHx8ICdVbmtub3duJyxcbiAgICAgICAgICBhbW91bnQ6IHBhcnNlRmxvYXQodG9rZW5BbW91bnQpLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycsIHsgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiA0IH0pLFxuICAgICAgICAgIGxvZ286IGV2ZW50LnNlbmRlcl9sb2dvX3VybFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0cmFuc2ZlckZyb20gPT09IGZyb21BZGRyZXNzICYmICFzZW50KSB7XG4gICAgICAgICAgc2VudCA9IHRva2VuRGV0YWlscztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHRyYW5zZmVyVG8gPT09IGZyb21BZGRyZXNzICYmICFyZWNlaXZlZCkge1xuICAgICAgICAgIHJlY2VpdmVkID0gdG9rZW5EZXRhaWxzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8g5qC55o2u6Kej5p6Q5Ye655qEIHNlbnQg5ZKMIHJlY2VpdmVkIOadpeehruWumuaTjeS9nOexu+Wei1xuICBsZXQgYWN0aW9uOiBTaW1wbGlmaWVkVHJhbnNhY3Rpb25bJ2FjdGlvbiddID0gJ090aGVyJztcbiAgaWYgKHNlbnQgJiYgcmVjZWl2ZWQpIHtcbiAgICBhY3Rpb24gPSAnU3dhcCc7XG4gIH0gZWxzZSBpZiAoc2VudCkge1xuICAgIGFjdGlvbiA9ICdUcmFuc2Zlcic7XG4gIH0gZWxzZSBpZiAodHgubG9nX2V2ZW50cyAmJiBBcnJheS5pc0FycmF5KHR4LmxvZ19ldmVudHMpICYmIHR4LmxvZ19ldmVudHMuc29tZSgoZTogYW55KSA9PiBlLmRlY29kZWQ/Lm5hbWUgPT09ICdBcHByb3ZhbCcpKSB7XG4gICAgYWN0aW9uID0gJ0FwcHJvdmFsJztcbiAgfVxuXG4gIC8vIOWvueS6jlN3YXDlkoxUcmFuc2Zlcu+8jOaIkeS7rOmcgOimgeWug+S7rOacieS7t+WAvOaJjeWxleekulxuICBpZiAoKGFjdGlvbiA9PT0gJ1N3YXAnIHx8IGFjdGlvbiA9PT0gJ1RyYW5zZmVyJykgJiYgKHR4LnZhbHVlX3F1b3RlID4gMSB8fCB0eC5nYXNfcXVvdGUgPiAwLjEpKSB7XG4gICAgIHJldHVybiB7XG4gICAgICB0eF9oYXNoOiB0eC50eF9oYXNoLFxuICAgICAgY2hhaW46IHR4LmNoYWluX25hbWUsXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKHR4LmJsb2NrX3NpZ25lZF9hdCkuZ2V0VGltZSgpLFxuICAgICAgdXNlcjogdXNlcixcbiAgICAgIGFjdGlvbjogYWN0aW9uLFxuICAgICAgc2VudDogc2VudCB8fCB1bmRlZmluZWQsXG4gICAgICByZWNlaXZlZDogcmVjZWl2ZWQgfHwgdW5kZWZpbmVkLFxuICAgICAgdXNkX3ZhbHVlOiB0eC52YWx1ZV9xdW90ZVxuICAgIH07XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuY29uc3QgZGVsYXkgPSAobXM6IG51bWJlcikgPT4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XG5cbi8vIOW4ruWKqeWHveaVsO+8muS7jiBHb2xkUnVzaCDojrflj5bljZXkuKrlnLDlnYDlkozpk77nmoTkuqTmmJNcbmFzeW5jIGZ1bmN0aW9uIGZldGNoVHJhbnNhY3Rpb25zRm9yQ2hhaW4oYWRkcmVzczogc3RyaW5nLCBjaGFpbk5hbWU6IHN0cmluZywgdXNlcjogYW55KSB7XG4gIGlmICghR09MRFJVU0hfQVBJX0tFWSkgcmV0dXJuIFtdO1xuXG4gIGNvbnN0IHVybCA9IGAke0dPTERSVVNIX0FQSV9CQVNFX1VSTH0vJHtjaGFpbk5hbWV9L2FkZHJlc3MvJHthZGRyZXNzfS90cmFuc2FjdGlvbnNfdjMvP3F1b3RlLWN1cnJlbmN5PVVTRCZuby1sb2dzPWZhbHNlJnBhZ2Utc2l6ZT01YDtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgaGVhZGVyczogeyAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtHT0xEUlVTSF9BUElfS0VZfWAgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgY29uc29sZS5lcnJvcihgR29sZFJ1c2ggQVBJIGVycm9yIGZvciAke2FkZHJlc3N9IG9uICR7Y2hhaW5OYW1lfTpgLCBhd2FpdCByZXNwb25zZS50ZXh0KCkpO1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgIGlmIChkYXRhLmVycm9yIHx8ICFkYXRhLmRhdGE/Lml0ZW1zKSB7XG4gICAgICAvLyBJdCdzIGNvbW1vbiBmb3IgYWRkcmVzc2VzIHRvIGhhdmUgbm8gdHJhbnNhY3Rpb25zLCBzbyB3ZSBkb24ndCBsb2cgYW4gZXJyb3IgZm9yIHRoYXQuXG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgcGFyc2VkVHhzID0gZGF0YS5kYXRhLml0ZW1zXG4gICAgICAubWFwKCh0eDogYW55KSA9PiBwYXJzZVRyYW5zYWN0aW9uKHR4LCB1c2VyKSlcbiAgICAgIC5maWx0ZXIoKHR4OiBTaW1wbGlmaWVkVHJhbnNhY3Rpb24gfCBudWxsKTogdHggaXMgU2ltcGxpZmllZFRyYW5zYWN0aW9uID0+IHR4ICE9PSBudWxsKTtcbiAgICAgIFxuICAgIHJldHVybiBwYXJzZWRUeHM7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggdHJhbnNhY3Rpb25zIGZyb20gR29sZFJ1c2ggZm9yICR7YWRkcmVzc30gb24gJHtjaGFpbk5hbWV9OmAsIGUpO1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKHJlcTogTmV4dFJlcXVlc3QpIHtcbiAgaWYgKCFHT0xEUlVTSF9BUElfS0VZKSB7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgbWVzc2FnZTogXCJHT0xEUlVTSF9BUElfS0VZIGlzIG5vdCBzZXRcIiB9LCB7IHN0YXR1czogNTAwIH0pO1xuICB9XG4gIFxuICBjb25zdCB7IHNlYXJjaFBhcmFtcyB9ID0gbmV3IFVSTChyZXEudXJsKTtcbiAgY29uc3QgZmlkUGFyYW0gPSBzZWFyY2hQYXJhbXMuZ2V0KCdmaWQnKTtcbiAgY29uc3QgYWRkcmVzc1BhcmFtID0gc2VhcmNoUGFyYW1zLmdldCgnYWRkcmVzcycpO1xuXG4gIGlmICghZmlkUGFyYW0gJiYgIWFkZHJlc3NQYXJhbSkge1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IG1lc3NhZ2U6IFwiZmlkIG9yIGFkZHJlc3MgaXMgcmVxdWlyZWRcIiB9LCB7IHN0YXR1czogNDAwIH0pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICAvLyAtLS0tIOWIhuaUryAxOiDmjInpkrHljIXlnLDlnYDmn6Xor6IgLS0tLVxuICAgIGlmIChhZGRyZXNzUGFyYW0pIHtcbiAgICAgIGNvbnN0IGFkZHJlc3MgPSBhZGRyZXNzUGFyYW0udG9Mb3dlckNhc2UoKTtcbiAgICAgIGxldCB1c2VyID0geyBmaWQ6IDAsIHVzZXJuYW1lOiAndW5rbm93bicsIGRpc3BsYXlfbmFtZTogJ1Vua25vd24nLCBwZnBfdXJsOiAnJyB9O1xuXG4gICAgICAvLyDlsJ3or5Xku47mlbDmja7lupPkuK3mn6Xmib7kuI7or6XpkrHljIXlhbPogZTnmoTnlKjmiLfkv6Hmga9cbiAgICAgIGNvbnN0IHsgZGF0YTogd2FsbGV0RGF0YSB9ID0gYXdhaXQgc3VwYWJhc2UuZnJvbSgnd2FsbGV0cycpLnNlbGVjdCgndXNlcl9maWQnKS5lcSgnYWRkcmVzcycsIGFkZHJlc3MpLnNpbmdsZSgpO1xuICAgICAgaWYgKHdhbGxldERhdGE/LnVzZXJfZmlkKSB7XG4gICAgICAgIGNvbnN0IHsgZGF0YTogdXNlckRhdGEgfSA9IGF3YWl0IHN1cGFiYXNlLmZyb20oJ3VzZXJzJykuc2VsZWN0KCcqJykuZXEoJ2ZpZCcsIHdhbGxldERhdGEudXNlcl9maWQpLnNpbmdsZSgpO1xuICAgICAgICBpZiAodXNlckRhdGEpIHtcbiAgICAgICAgICB1c2VyID0geyBmaWQ6IHVzZXJEYXRhLmZpZCwgdXNlcm5hbWU6IHVzZXJEYXRhLnVzZXJuYW1lLCBkaXNwbGF5X25hbWU6IHVzZXJEYXRhLmRpc3BsYXlfbmFtZSwgcGZwX3VybDogdXNlckRhdGEucGZwX3VybCB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIOWQjOaXtuafpeivoiBldGgtbWFpbm5ldCDlkowgbW9uYWQtdGVzdG5ldFxuICAgICAgY29uc3QgZXRoVHhzID0gYXdhaXQgZmV0Y2hUcmFuc2FjdGlvbnNGb3JDaGFpbihhZGRyZXNzLCBcImV0aC1tYWlubmV0XCIsIHVzZXIpO1xuICAgICAgY29uc3QgbW9uYWRUeHMgPSBhd2FpdCBmZXRjaFRyYW5zYWN0aW9uc0ZvckNoYWluKGFkZHJlc3MsIFwibW9uYWQtdGVzdG5ldFwiLCB1c2VyKTtcbiAgICAgIGNvbnN0IHRyYW5zYWN0aW9ucyA9IFsuLi5ldGhUeHMsIC4uLm1vbmFkVHhzXTtcbiAgICAgIFxuICAgICAgdHJhbnNhY3Rpb25zLnNvcnQoKGE6IFNpbXBsaWZpZWRUcmFuc2FjdGlvbiwgYjogU2ltcGxpZmllZFRyYW5zYWN0aW9uKSA9PiBiLnRpbWVzdGFtcCAtIGEudGltZXN0YW1wKTtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih0cmFuc2FjdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIC0tLS0g5YiG5pSvIDI6IOaMiSBGSUQg5p+l6K+iIC0tLS1cbiAgICBpZiAoZmlkUGFyYW0pIHtcbiAgICAgIGNvbnN0IHN0cmVhbSA9IG5ldyBSZWFkYWJsZVN0cmVhbSh7XG4gICAgICAgIGFzeW5jIHN0YXJ0KGNvbnRyb2xsZXIpIHtcbiAgICAgICAgICBjb25zdCBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gICAgICAgICAgY29uc3QgcHVzaEV2ZW50ID0gKGV2ZW50OiBzdHJpbmcsIGRhdGE6IG9iamVjdCkgPT4ge1xuICAgICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKGVuY29kZXIuZW5jb2RlKGBldmVudDogJHtldmVudH1cXG5gKSk7XG4gICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoZW5jb2Rlci5lbmNvZGUoYGRhdGE6ICR7SlNPTi5zdHJpbmdpZnkoZGF0YSl9XFxuXFxuYCkpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZmlkID0gcGFyc2VJbnQoZmlkUGFyYW0pO1xuICAgICAgICAgICAgbGV0IGN1cnNvcjogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgICAgICAgICBsZXQgYUZvbGxvd2luZ0ZvdW5kID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgLy8gMS4g5oyJ6aG16I635Y+W5YWz5rOo6ICFXG4gICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgbmV5bmFyQ2xpZW50LmZldGNoVXNlckZvbGxvd2luZyh7IGZpZCwgbGltaXQ6IDEwMCwgY3Vyc29yOiBjdXJzb3IgPz8gdW5kZWZpbmVkIH0pO1xuICAgICAgICAgICAgICBjb25zdCBmb2xsb3dpbmdCYXRjaCA9IHJlc3BvbnNlLnVzZXJzO1xuICAgICAgICAgICAgICBjdXJzb3IgPSByZXNwb25zZS5uZXh0LmN1cnNvcjtcblxuICAgICAgICAgICAgICBpZiAoZm9sbG93aW5nQmF0Y2gubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGFGb2xsb3dpbmdGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9sbG93aW5nRmlkcyA9IGZvbGxvd2luZ0JhdGNoLm1hcChpdGVtID0+IGl0ZW0udXNlci5maWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJNYXAgPSBuZXcgTWFwKGZvbGxvd2luZ0JhdGNoLm1hcChpdGVtID0+IFtpdGVtLnVzZXIuZmlkLCBpdGVtLnVzZXJdKSk7XG5cbiAgICAgICAgICAgICAgICAvLyAyLiDojrflj5bor6XmibnmrKHlhbPms6jogIXnmoTpkrHljIVcbiAgICAgICAgICAgICAgICBjb25zdCB7IGRhdGE6IHdhbGxldHMsIGVycm9yOiBkYkVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxuICAgICAgICAgICAgICAgICAgLmZyb20oJ3dhbGxldHMnKVxuICAgICAgICAgICAgICAgICAgLnNlbGVjdCgndXNlcl9maWQsIGFkZHJlc3MnKVxuICAgICAgICAgICAgICAgICAgLmluKCd1c2VyX2ZpZCcsIGZvbGxvd2luZ0ZpZHMpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGRiRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJTdXBhYmFzZSBlcnJvciBmZXRjaGluZyB3YWxsZXRzIGZvciBhIGJhdGNoOlwiLCBkYkVycm9yKTtcbiAgICAgICAgICAgICAgICAgIGNvbnRpbnVlOyAvLyDot7Pov4fmraTmibnmrKFcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBldm1XYWxsZXRzID0gd2FsbGV0cyA/IHdhbGxldHMuZmlsdGVyKHcgPT4gdy5hZGRyZXNzLnN0YXJ0c1dpdGgoJzB4JykpIDogW107XG5cbiAgICAgICAgICAgICAgICAvLyAzLiDkuLror6XmibnmrKHnmoTmr4/kuKrpkrHljIXojrflj5bkuqTmmJPlubbnq4vljbPmjqjpgIFcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHdhbGxldCBvZiBldm1XYWxsZXRzKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB1c2VyID0gdXNlck1hcC5nZXQod2FsbGV0LnVzZXJfZmlkKTtcbiAgICAgICAgICAgICAgICAgIGlmICghdXNlcikgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICAgIGNvbnN0IGV0aFR4cyA9IGF3YWl0IGZldGNoVHJhbnNhY3Rpb25zRm9yQ2hhaW4od2FsbGV0LmFkZHJlc3MsIFwiZXRoLW1haW5uZXRcIiwgdXNlcik7XG4gICAgICAgICAgICAgICAgICBjb25zdCBtb25hZFR4cyA9IGF3YWl0IGZldGNoVHJhbnNhY3Rpb25zRm9yQ2hhaW4od2FsbGV0LmFkZHJlc3MsIFwibW9uYWQtdGVzdG5ldFwiLCB1c2VyKTtcbiAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb25zID0gWy4uLmV0aFR4cywgLi4ubW9uYWRUeHNdO1xuICAgICAgICAgICAgICAgICAgaWYgKHRyYW5zYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHB1c2hFdmVudCgndHJhbnNhY3Rpb24nLCB0cmFuc2FjdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgYXdhaXQgZGVsYXkoMjUwKTsgLy8g5aKe5Yqg5bu25pe25Lul6YG/5YWNQVBJ6ZmQ6YCfXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IHdoaWxlIChjdXJzb3IpOyAvLyA0LiDlpoLmnpzmnInkuIvkuIDpobXvvIzliJnnu6fnu63lvqrnjq9cblxuICAgICAgICAgICAgaWYgKCFhRm9sbG93aW5nRm91bmQpIHtcbiAgICAgICAgICAgICAgcHVzaEV2ZW50KCdkb25lJywgeyBtZXNzYWdlOiAnTm8gb25lIGZvbGxvd2VkLicgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwdXNoRXZlbnQoJ2RvbmUnLCB7IG1lc3NhZ2U6ICdTdHJlYW0gY29tcGxldGVkJyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlN0cmVhbWluZyBlcnJvcjpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gKGVycm9yIGFzIGFueSkubWVzc2FnZSB8fCAnQW4gdW5rbm93biBlcnJvciBvY2N1cnJlZCc7XG4gICAgICAgICAgICBwdXNoRXZlbnQoJ2Vycm9yJywgeyBtZXNzYWdlOiBcIlN0cmVhbWluZyBmYWlsZWRcIiwgZXJyb3I6IGVycm9yTWVzc2FnZSB9KTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgY29udHJvbGxlci5jbG9zZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKHN0cmVhbSwge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICd0ZXh0L2V2ZW50LXN0cmVhbScsXG4gICAgICAgICAgJ0NhY2hlLUNvbnRyb2wnOiAnbm8tY2FjaGUnLFxuICAgICAgICAgICdDb25uZWN0aW9uJzogJ2tlZXAtYWxpdmUnLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfVxuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBmZXRjaCB0cmFuc2FjdGlvbnM6XCIsIGVycm9yKTtcbiAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSAoZXJyb3IgYXMgYW55KS5tZXNzYWdlIHx8ICdBbiB1bmtub3duIGVycm9yIG9jY3VycmVkJztcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBtZXNzYWdlOiBcIkZhaWxlZCB0byBmZXRjaCB0cmFuc2FjdGlvbnNcIiwgZXJyb3I6IGVycm9yTWVzc2FnZSB9LCB7IHN0YXR1czogNTAwIH0pO1xuICB9XG4gIFxuICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBtZXNzYWdlOiBcIkludmFsaWQgcmVxdWVzdFwiIH0sIHsgc3RhdHVzOiA0MDAgfSk7XG59ICJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJOZXluYXJBUElDbGllbnQiLCJDb25maWd1cmF0aW9uIiwic3VwYWJhc2UiLCJldGhlcnMiLCJwcm9jZXNzIiwiZW52IiwiTkVZTkFSX0FQSV9LRVkiLCJFcnJvciIsIm5leW5hckNsaWVudCIsImFwaUtleSIsIkdPTERSVVNIX0FQSV9LRVkiLCJHT0xEUlVTSF9BUElfQkFTRV9VUkwiLCJwYXJzZVRyYW5zYWN0aW9uIiwidHgiLCJ1c2VyIiwiZnJvbUFkZHJlc3MiLCJmcm9tX2FkZHJlc3MiLCJ0b0xvd2VyQ2FzZSIsInNlbnQiLCJyZWNlaXZlZCIsImxvZ19ldmVudHMiLCJBcnJheSIsImlzQXJyYXkiLCJldmVudCIsImRlY29kZWQiLCJuYW1lIiwicGFyYW1zIiwidHJhbnNmZXJGcm9tIiwiZmluZCIsInAiLCJ2YWx1ZSIsInRyYW5zZmVyVG8iLCJ0b2tlbkFtb3VudCIsImZvcm1hdFVuaXRzIiwic2VuZGVyX2NvbnRyYWN0X2RlY2ltYWxzIiwidG9rZW5EZXRhaWxzIiwidG9rZW4iLCJzZW5kZXJfY29udHJhY3RfdGlja2VyX3N5bWJvbCIsImFtb3VudCIsInBhcnNlRmxvYXQiLCJ0b0xvY2FsZVN0cmluZyIsIm1heGltdW1GcmFjdGlvbkRpZ2l0cyIsImxvZ28iLCJzZW5kZXJfbG9nb191cmwiLCJhY3Rpb24iLCJzb21lIiwiZSIsInZhbHVlX3F1b3RlIiwiZ2FzX3F1b3RlIiwidHhfaGFzaCIsImNoYWluIiwiY2hhaW5fbmFtZSIsInRpbWVzdGFtcCIsIkRhdGUiLCJibG9ja19zaWduZWRfYXQiLCJnZXRUaW1lIiwidW5kZWZpbmVkIiwidXNkX3ZhbHVlIiwiZGVsYXkiLCJtcyIsIlByb21pc2UiLCJyZXNvbHZlIiwic2V0VGltZW91dCIsImZldGNoVHJhbnNhY3Rpb25zRm9yQ2hhaW4iLCJhZGRyZXNzIiwiY2hhaW5OYW1lIiwidXJsIiwicmVzcG9uc2UiLCJmZXRjaCIsImhlYWRlcnMiLCJvayIsImNvbnNvbGUiLCJlcnJvciIsInRleHQiLCJkYXRhIiwianNvbiIsIml0ZW1zIiwicGFyc2VkVHhzIiwibWFwIiwiZmlsdGVyIiwiR0VUIiwicmVxIiwibWVzc2FnZSIsInN0YXR1cyIsInNlYXJjaFBhcmFtcyIsIlVSTCIsImZpZFBhcmFtIiwiZ2V0IiwiYWRkcmVzc1BhcmFtIiwiZmlkIiwidXNlcm5hbWUiLCJkaXNwbGF5X25hbWUiLCJwZnBfdXJsIiwid2FsbGV0RGF0YSIsImZyb20iLCJzZWxlY3QiLCJlcSIsInNpbmdsZSIsInVzZXJfZmlkIiwidXNlckRhdGEiLCJldGhUeHMiLCJtb25hZFR4cyIsInRyYW5zYWN0aW9ucyIsInNvcnQiLCJhIiwiYiIsInN0cmVhbSIsIlJlYWRhYmxlU3RyZWFtIiwic3RhcnQiLCJjb250cm9sbGVyIiwiZW5jb2RlciIsIlRleHRFbmNvZGVyIiwicHVzaEV2ZW50IiwiZW5xdWV1ZSIsImVuY29kZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJwYXJzZUludCIsImN1cnNvciIsImFGb2xsb3dpbmdGb3VuZCIsImZldGNoVXNlckZvbGxvd2luZyIsImxpbWl0IiwiZm9sbG93aW5nQmF0Y2giLCJ1c2VycyIsIm5leHQiLCJsZW5ndGgiLCJmb2xsb3dpbmdGaWRzIiwiaXRlbSIsInVzZXJNYXAiLCJNYXAiLCJ3YWxsZXRzIiwiZGJFcnJvciIsImluIiwiZXZtV2FsbGV0cyIsInciLCJzdGFydHNXaXRoIiwid2FsbGV0IiwiZXJyb3JNZXNzYWdlIiwiY2xvc2UiLCJSZXNwb25zZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/transactions/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/supabase.ts":
/*!*************************!*\
  !*** ./lib/supabase.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   supabase: () => (/* binding */ supabase)\n/* harmony export */ });\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n\nconst supabaseUrl = \"https://wtrcyazzyuvrvtfivhbd.supabase.co\";\nconst supabaseAnonKey = \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cmN5YXp6eXV2cnZ0Zml2aGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyOTM5OTcsImV4cCI6MjA2NDg2OTk5N30.bh9NMGzaXtt1lnwOq3OG9_OqdIk1oUswQuXeb-cwcXk\";\nif (!supabaseUrl || !supabaseAnonKey) {\n    throw new Error('Supabase URL or Anon key is not set in .env');\n}\nconst supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__.createClient)(supabaseUrl, supabaseAnonKey);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvc3VwYWJhc2UudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBb0Q7QUFFcEQsTUFBTUMsY0FBY0MsMENBQW9DO0FBQ3hELE1BQU1HLGtCQUFrQkgsa05BQXlDO0FBRWpFLElBQUksQ0FBQ0QsZUFBZSxDQUFDSSxpQkFBaUI7SUFDbEMsTUFBTSxJQUFJRSxNQUFNO0FBQ3BCO0FBRU8sTUFBTUMsV0FBV1IsbUVBQVlBLENBQUNDLGFBQWFJLGlCQUFnQiIsInNvdXJjZXMiOlsiL1VzZXJzL2FydmluL0RvY3VtZW50cy9Xb3JrIExvY2FsL1RoZSBDb21wYW55IExvY2FsL0V4dGVybmFsL1NpZ25hbENhc3QvbGliL3N1cGFiYXNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcydcblxuY29uc3Qgc3VwYWJhc2VVcmwgPSBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkxcbmNvbnN0IHN1cGFiYXNlQW5vbktleSA9IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZXG5cbmlmICghc3VwYWJhc2VVcmwgfHwgIXN1cGFiYXNlQW5vbktleSkge1xuICAgIHRocm93IG5ldyBFcnJvcignU3VwYWJhc2UgVVJMIG9yIEFub24ga2V5IGlzIG5vdCBzZXQgaW4gLmVudicpXG59XG5cbmV4cG9ydCBjb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChzdXBhYmFzZVVybCwgc3VwYWJhc2VBbm9uS2V5KSAiXSwibmFtZXMiOlsiY3JlYXRlQ2xpZW50Iiwic3VwYWJhc2VVcmwiLCJwcm9jZXNzIiwiZW52IiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMIiwic3VwYWJhc2VBbm9uS2V5IiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfQU5PTl9LRVkiLCJFcnJvciIsInN1cGFiYXNlIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./lib/supabase.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/@supabase/realtime-js/dist/main sync recursive":
/*!************************************************************!*\
  !*** ./node_modules/@supabase/realtime-js/dist/main/ sync ***!
  \************************************************************/
/***/ ((module) => {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = "(rsc)/./node_modules/@supabase/realtime-js/dist/main sync recursive";
module.exports = webpackEmptyContext;

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftransactions%2Froute&page=%2Fapi%2Ftransactions%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftransactions%2Froute.ts&appDir=%2FUsers%2Farvin%2FDocuments%2FWork%20Local%2FThe%20Company%20Local%2FExternal%2FSignalCast%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Farvin%2FDocuments%2FWork%20Local%2FThe%20Company%20Local%2FExternal%2FSignalCast&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftransactions%2Froute&page=%2Fapi%2Ftransactions%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftransactions%2Froute.ts&appDir=%2FUsers%2Farvin%2FDocuments%2FWork%20Local%2FThe%20Company%20Local%2FExternal%2FSignalCast%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Farvin%2FDocuments%2FWork%20Local%2FThe%20Company%20Local%2FExternal%2FSignalCast&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_arvin_Documents_Work_Local_The_Company_Local_External_SignalCast_app_api_transactions_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/transactions/route.ts */ \"(rsc)/./app/api/transactions/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/transactions/route\",\n        pathname: \"/api/transactions\",\n        filename: \"route\",\n        bundlePath: \"app/api/transactions/route\"\n    },\n    resolvedPagePath: \"/Users/arvin/Documents/Work Local/The Company Local/External/SignalCast/app/api/transactions/route.ts\",\n    nextConfigOutput,\n    userland: _Users_arvin_Documents_Work_Local_The_Company_Local_External_SignalCast_app_api_transactions_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZ0cmFuc2FjdGlvbnMlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRnRyYW5zYWN0aW9ucyUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRnRyYW5zYWN0aW9ucyUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmFydmluJTJGRG9jdW1lbnRzJTJGV29yayUyMExvY2FsJTJGVGhlJTIwQ29tcGFueSUyMExvY2FsJTJGRXh0ZXJuYWwlMkZTaWduYWxDYXN0JTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZVc2VycyUyRmFydmluJTJGRG9jdW1lbnRzJTJGV29yayUyMExvY2FsJTJGVGhlJTIwQ29tcGFueSUyMExvY2FsJTJGRXh0ZXJuYWwlMkZTaWduYWxDYXN0JmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUNxRDtBQUNsSTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IseUdBQW1CO0FBQzNDO0FBQ0EsY0FBYyxrRUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLHNEQUFzRDtBQUM5RDtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUMwRjs7QUFFMUYiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiL1VzZXJzL2FydmluL0RvY3VtZW50cy9Xb3JrIExvY2FsL1RoZSBDb21wYW55IExvY2FsL0V4dGVybmFsL1NpZ25hbENhc3QvYXBwL2FwaS90cmFuc2FjdGlvbnMvcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL3RyYW5zYWN0aW9ucy9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3RyYW5zYWN0aW9uc1wiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvdHJhbnNhY3Rpb25zL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL1VzZXJzL2FydmluL0RvY3VtZW50cy9Xb3JrIExvY2FsL1RoZSBDb21wYW55IExvY2FsL0V4dGVybmFsL1NpZ25hbENhc3QvYXBwL2FwaS90cmFuc2FjdGlvbnMvcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftransactions%2Froute&page=%2Fapi%2Ftransactions%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftransactions%2Froute.ts&appDir=%2FUsers%2Farvin%2FDocuments%2FWork%20Local%2FThe%20Company%20Local%2FExternal%2FSignalCast%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Farvin%2FDocuments%2FWork%20Local%2FThe%20Company%20Local%2FExternal%2FSignalCast&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "node:crypto":
/*!******************************!*\
  !*** external "node:crypto" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:crypto");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ "tty":
/*!**********************!*\
  !*** external "tty" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tty");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/viem","vendor-chunks/next","vendor-chunks/@noble","vendor-chunks/@supabase","vendor-chunks/@neynar","vendor-chunks/semver","vendor-chunks/@scure","vendor-chunks/asynckit","vendor-chunks/math-intrinsics","vendor-chunks/ethers","vendor-chunks/es-errors","vendor-chunks/whatwg-url","vendor-chunks/call-bind-apply-helpers","vendor-chunks/debug","vendor-chunks/get-proto","vendor-chunks/utf-8-validate","vendor-chunks/tr46","vendor-chunks/node-gyp-build","vendor-chunks/mime-db","vendor-chunks/has-symbols","vendor-chunks/gopd","vendor-chunks/function-bind","vendor-chunks/form-data","vendor-chunks/follow-redirects","vendor-chunks/bufferutil","vendor-chunks/axios","vendor-chunks/webidl-conversions","vendor-chunks/supports-color","vendor-chunks/proxy-from-env","vendor-chunks/ms","vendor-chunks/mime-types","vendor-chunks/hasown","vendor-chunks/has-tostringtag","vendor-chunks/has-flag","vendor-chunks/get-intrinsic","vendor-chunks/es-set-tostringtag","vendor-chunks/es-object-atoms","vendor-chunks/es-define-property","vendor-chunks/dunder-proto","vendor-chunks/delayed-stream","vendor-chunks/combined-stream"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftransactions%2Froute&page=%2Fapi%2Ftransactions%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftransactions%2Froute.ts&appDir=%2FUsers%2Farvin%2FDocuments%2FWork%20Local%2FThe%20Company%20Local%2FExternal%2FSignalCast%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Farvin%2FDocuments%2FWork%20Local%2FThe%20Company%20Local%2FExternal%2FSignalCast&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();