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
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _neynar_nodejs_sdk__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @neynar/nodejs-sdk */ \"(rsc)/./node_modules/@neynar/nodejs-sdk/build/index.js\");\n/* harmony import */ var _neynar_nodejs_sdk__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_neynar_nodejs_sdk__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_supabase__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../lib/supabase */ \"(rsc)/./lib/supabase.ts\");\n/* harmony import */ var ethers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ethers */ \"(rsc)/./node_modules/ethers/lib.esm/utils/units.js\");\n\n\n\n\n// 初始化 Neynar 客户端\nif (!process.env.NEYNAR_API_KEY) {\n    throw new Error(\"NEYNAR_API_KEY is not set in .env.local\");\n}\nconst neynarClient = new _neynar_nodejs_sdk__WEBPACK_IMPORTED_MODULE_1__.NeynarAPIClient(new _neynar_nodejs_sdk__WEBPACK_IMPORTED_MODULE_1__.Configuration({\n    apiKey: process.env.NEYNAR_API_KEY\n}));\n// GoldRush API Configuration\nconst GOLDRUSH_API_KEY = process.env.GOLDRUSH_API_KEY;\nconst GOLDRUSH_API_BASE_URL = \"https://api.covalenthq.com/v1\";\n// 解析从 GoldRush API 获取的原始交易数据\nfunction parseTransaction(tx, user, chainName) {\n    const fromAddress = tx.from_address.toLowerCase();\n    let sent = null;\n    let received = null;\n    // 安全检查：确保 log_events 是一个可遍历的数组\n    if (tx.log_events && Array.isArray(tx.log_events)) {\n        for (const event of tx.log_events){\n            if (event.decoded?.name === 'Transfer') {\n                const params = event.decoded.params;\n                const transferFrom = params.find((p)=>p.name === 'from')?.value?.toLowerCase();\n                const transferTo = params.find((p)=>p.name === 'to')?.value?.toLowerCase();\n                const value = params.find((p)=>p.name === 'value')?.value;\n                if (!transferFrom || !transferTo || !value) continue;\n                const tokenAmount = ethers__WEBPACK_IMPORTED_MODULE_3__.formatUnits(value, event.sender_contract_decimals || 18);\n                const tokenDetails = {\n                    token: event.sender_contract_ticker_symbol || 'Unknown',\n                    amount: parseFloat(tokenAmount).toLocaleString('en-US', {\n                        maximumFractionDigits: 4\n                    }),\n                    logo: event.sender_logo_url,\n                    contract_address: event.sender_address\n                };\n                if (transferFrom === fromAddress && !sent) {\n                    sent = tokenDetails;\n                }\n                if (transferTo === fromAddress && !received) {\n                    received = tokenDetails;\n                }\n            }\n        }\n    }\n    // 根据解析出的 sent 和 received 来确定操作类型\n    let action = 'Other';\n    if (sent && received) {\n        action = 'Swap';\n    } else if (sent) {\n        action = 'Transfer';\n    } else if (tx.log_events && Array.isArray(tx.log_events) && tx.log_events.some((e)=>e.decoded?.name === 'Approval')) {\n        action = 'Approval';\n    }\n    // 对于Swap和Transfer，我们需要它们有价值才展示\n    if ((action === 'Swap' || action === 'Transfer') && (tx.value_quote > 1 || tx.gas_quote > 0.1)) {\n        return {\n            tx_hash: tx.tx_hash,\n            chain: chainName,\n            timestamp: new Date(tx.block_signed_at).getTime(),\n            user: user,\n            action: action,\n            sent: sent || undefined,\n            received: received || undefined,\n            usd_value: tx.value_quote\n        };\n    }\n    return null;\n}\nconst delay = (ms)=>new Promise((resolve)=>setTimeout(resolve, ms));\n// 帮助函数：从 GoldRush 获取单个地址和链的交易\nasync function fetchTransactionsForChain(address, chainName, user) {\n    if (!GOLDRUSH_API_KEY) return [];\n    const url = `${GOLDRUSH_API_BASE_URL}/${chainName}/address/${address}/transactions_v3/?quote-currency=USD&no-logs=false&page-size=5`;\n    try {\n        const response = await fetch(url, {\n            headers: {\n                'Authorization': `Bearer ${GOLDRUSH_API_KEY}`\n            }\n        });\n        if (!response.ok) {\n            console.error(`GoldRush API error for ${address} on ${chainName}:`, await response.text());\n            return [];\n        }\n        const data = await response.json();\n        if (data.error || !data.data?.items) {\n            // It's common for addresses to have no transactions, so we don't log an error for that.\n            return [];\n        }\n        const parsedTxs = data.data.items.map((tx)=>parseTransaction(tx, user, chainName)).filter((tx)=>tx !== null);\n        return parsedTxs;\n    } catch (e) {\n        console.error(`Failed to fetch transactions from GoldRush for ${address} on ${chainName}:`, e);\n        return [];\n    }\n}\nasync function GET(req) {\n    if (!GOLDRUSH_API_KEY) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            message: \"GOLDRUSH_API_KEY is not set\"\n        }, {\n            status: 500\n        });\n    }\n    const { searchParams } = new URL(req.url);\n    const fidParam = searchParams.get('fid');\n    const addressParam = searchParams.get('address');\n    if (!fidParam && !addressParam) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            message: \"fid or address is required\"\n        }, {\n            status: 400\n        });\n    }\n    try {\n        // ---- 分支 1: 按钱包地址查询 ----\n        if (addressParam) {\n            const address = addressParam.toLowerCase();\n            let user = {\n                fid: 0,\n                username: 'unknown',\n                display_name: 'Unknown',\n                pfp_url: ''\n            };\n            // 尝试从数据库中查找与该钱包关联的用户信息\n            const { data: walletData } = await _lib_supabase__WEBPACK_IMPORTED_MODULE_2__.supabase.from('wallets').select('user_fid').eq('address', address).single();\n            if (walletData?.user_fid) {\n                const { data: userData } = await _lib_supabase__WEBPACK_IMPORTED_MODULE_2__.supabase.from('users').select('*').eq('fid', walletData.user_fid).single();\n                if (userData) {\n                    user = {\n                        fid: userData.fid,\n                        username: userData.username,\n                        display_name: userData.display_name,\n                        pfp_url: userData.pfp_url\n                    };\n                }\n            }\n            // 同时查询 eth-mainnet 和 monad-testnet\n            const ethTxs = await fetchTransactionsForChain(address, \"eth-mainnet\", user);\n            const monadTxs = await fetchTransactionsForChain(address, \"monad-testnet\", user);\n            const transactions = [\n                ...ethTxs,\n                ...monadTxs\n            ];\n            transactions.sort((a, b)=>b.timestamp - a.timestamp);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(transactions);\n        }\n        // ---- 分支 2: 按 FID 查询 ----\n        if (fidParam) {\n            const stream = new ReadableStream({\n                async start (controller) {\n                    const encoder = new TextEncoder();\n                    const pushEvent = (event, data)=>{\n                        controller.enqueue(encoder.encode(`event: ${event}\\n`));\n                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\\n\\n`));\n                    };\n                    try {\n                        const fid = parseInt(fidParam);\n                        let cursor = null;\n                        let aFollowingFound = false;\n                        do {\n                            // 1. 按页获取关注者\n                            const response = await neynarClient.fetchUserFollowing({\n                                fid,\n                                limit: 100,\n                                cursor: cursor ?? undefined\n                            });\n                            const followingBatch = response.users;\n                            cursor = response.next.cursor;\n                            if (followingBatch.length > 0) {\n                                aFollowingFound = true;\n                                const followingFids = followingBatch.map((item)=>item.user.fid);\n                                const userMap = new Map(followingBatch.map((item)=>[\n                                        item.user.fid,\n                                        item.user\n                                    ]));\n                                // 2. 获取该批次关注者的钱包\n                                const { data: wallets, error: dbError } = await _lib_supabase__WEBPACK_IMPORTED_MODULE_2__.supabase.from('wallets').select('user_fid, address').in('user_fid', followingFids);\n                                if (dbError) {\n                                    console.error(\"Supabase error fetching wallets for a batch:\", dbError);\n                                    continue; // 跳过此批次\n                                }\n                                const evmWallets = wallets ? wallets.filter((w)=>w.address.startsWith('0x')) : [];\n                                // 3. 为该批次的每个钱包获取交易并立即推送\n                                for (const wallet of evmWallets){\n                                    const user = userMap.get(wallet.user_fid);\n                                    if (!user) continue;\n                                    const ethTxs = await fetchTransactionsForChain(wallet.address, \"eth-mainnet\", user);\n                                    const monadTxs = await fetchTransactionsForChain(wallet.address, \"monad-testnet\", user);\n                                    const transactions = [\n                                        ...ethTxs,\n                                        ...monadTxs\n                                    ];\n                                    if (transactions.length > 0) {\n                                        pushEvent('transaction', transactions);\n                                    }\n                                    await delay(250); // 增加延时以避免API限速\n                                }\n                            }\n                        }while (cursor); // 4. 如果有下一页，则继续循环\n                        if (!aFollowingFound) {\n                            pushEvent('done', {\n                                message: 'No one followed.'\n                            });\n                        } else {\n                            pushEvent('done', {\n                                message: 'Stream completed'\n                            });\n                        }\n                    } catch (error) {\n                        console.error(\"Streaming error:\", error);\n                        const errorMessage = error.message || 'An unknown error occurred';\n                        pushEvent('error', {\n                            message: \"Streaming failed\",\n                            error: errorMessage\n                        });\n                    } finally{\n                        controller.close();\n                    }\n                }\n            });\n            return new Response(stream, {\n                headers: {\n                    'Content-Type': 'text/event-stream',\n                    'Cache-Control': 'no-cache',\n                    'Connection': 'keep-alive'\n                }\n            });\n        }\n    } catch (error) {\n        console.error(\"Failed to fetch transactions:\", error);\n        const errorMessage = error.message || 'An unknown error occurred';\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            message: \"Failed to fetch transactions\",\n            error: errorMessage\n        }, {\n            status: 500\n        });\n    }\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        message: \"Invalid request\"\n    }, {\n        status: 400\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QyxhQUFhdUIsTUFBTSxHQUFHLEdBQUc7d0NBQzNCYixVQUFVLGVBQWVWO29DQUMzQjtvQ0FDQSxNQUFNM0MsTUFBTSxNQUFNLGVBQWU7Z0NBQ25DOzRCQUNGO3dCQUNGLFFBQVMyRCxRQUFRLENBQUMsa0JBQWtCO3dCQUVwQyxJQUFJLENBQUNDLGlCQUFpQjs0QkFDcEJQLFVBQVUsUUFBUTtnQ0FBRTlCLFNBQVM7NEJBQW1CO3dCQUNsRCxPQUFPOzRCQUNMOEIsVUFBVSxRQUFRO2dDQUFFOUIsU0FBUzs0QkFBbUI7d0JBQ2xEO29CQUNGLEVBQUUsT0FBT1YsT0FBTzt3QkFDZEQsUUFBUUMsS0FBSyxDQUFDLG9CQUFvQkE7d0JBQ2xDLE1BQU1pRSxlQUFlLE1BQWV2RCxPQUFPLElBQUk7d0JBQy9DOEIsVUFBVSxTQUFTOzRCQUFFOUIsU0FBUzs0QkFBb0JWLE9BQU9pRTt3QkFBYTtvQkFDeEUsU0FBVTt3QkFDUjVCLFdBQVc2QixLQUFLO29CQUNsQjtnQkFDRjtZQUNGO1lBRUEsT0FBTyxJQUFJQyxTQUFTakMsUUFBUTtnQkFDMUJyQyxTQUFTO29CQUNQLGdCQUFnQjtvQkFDaEIsaUJBQWlCO29CQUNqQixjQUFjO2dCQUNoQjtZQUNGO1FBQ0Y7SUFFRixFQUFFLE9BQU9HLE9BQU87UUFDZEQsUUFBUUMsS0FBSyxDQUFDLGlDQUFpQ0E7UUFDL0MsTUFBTWlFLGVBQWUsTUFBZXZELE9BQU8sSUFBSTtRQUMvQyxPQUFPcEYscURBQVlBLENBQUM2RSxJQUFJLENBQUM7WUFBRU8sU0FBUztZQUFnQ1YsT0FBT2lFO1FBQWEsR0FBRztZQUFFdEQsUUFBUTtRQUFJO0lBQzNHO0lBRUEsT0FBT3JGLHFEQUFZQSxDQUFDNkUsSUFBSSxDQUFDO1FBQUVPLFNBQVM7SUFBa0IsR0FBRztRQUFFQyxRQUFRO0lBQUk7QUFDekUiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hcnZpbi9Eb2N1bWVudHMvV29yayBMb2NhbC9UaGUgQ29tcGFueSBMb2NhbC9FeHRlcm5hbC9TaWduYWxDYXN0L2FwcC9hcGkvdHJhbnNhY3Rpb25zL3JvdXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXF1ZXN0LCBOZXh0UmVzcG9uc2UgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIjtcbmltcG9ydCB7IE5leW5hckFQSUNsaWVudCwgQ29uZmlndXJhdGlvbiB9IGZyb20gXCJAbmV5bmFyL25vZGVqcy1zZGtcIjtcbmltcG9ydCB7IHN1cGFiYXNlIH0gZnJvbSBcIi4uLy4uLy4uL2xpYi9zdXBhYmFzZVwiO1xuaW1wb3J0IHsgZXRoZXJzIH0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHsgU2ltcGxpZmllZFRyYW5zYWN0aW9uIH0gZnJvbSBcIi4uLy4uLy4uL2xpYi90eXBlc1wiO1xuXG4vLyDliJ3lp4vljJYgTmV5bmFyIOWuouaIt+err1xuaWYgKCFwcm9jZXNzLmVudi5ORVlOQVJfQVBJX0tFWSkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJORVlOQVJfQVBJX0tFWSBpcyBub3Qgc2V0IGluIC5lbnYubG9jYWxcIik7XG59XG5jb25zdCBuZXluYXJDbGllbnQgPSBuZXcgTmV5bmFyQVBJQ2xpZW50KG5ldyBDb25maWd1cmF0aW9uKHtcbiAgICBhcGlLZXk6IHByb2Nlc3MuZW52Lk5FWU5BUl9BUElfS0VZLFxufSkpO1xuXG4vLyBHb2xkUnVzaCBBUEkgQ29uZmlndXJhdGlvblxuY29uc3QgR09MRFJVU0hfQVBJX0tFWSA9IHByb2Nlc3MuZW52LkdPTERSVVNIX0FQSV9LRVk7XG5jb25zdCBHT0xEUlVTSF9BUElfQkFTRV9VUkwgPSBcImh0dHBzOi8vYXBpLmNvdmFsZW50aHEuY29tL3YxXCI7XG5cbi8vIOino+aekOS7jiBHb2xkUnVzaCBBUEkg6I635Y+W55qE5Y6f5aeL5Lqk5piT5pWw5o2uXG5mdW5jdGlvbiBwYXJzZVRyYW5zYWN0aW9uKHR4OiBhbnksIHVzZXI6IGFueSwgY2hhaW5OYW1lOiBzdHJpbmcpOiBTaW1wbGlmaWVkVHJhbnNhY3Rpb24gfCBudWxsIHtcbiAgY29uc3QgZnJvbUFkZHJlc3MgPSB0eC5mcm9tX2FkZHJlc3MudG9Mb3dlckNhc2UoKTtcbiAgbGV0IHNlbnQgPSBudWxsO1xuICBsZXQgcmVjZWl2ZWQgPSBudWxsO1xuXG4gIC8vIOWuieWFqOajgOafpe+8muehruS/nSBsb2dfZXZlbnRzIOaYr+S4gOS4quWPr+mBjeWOhueahOaVsOe7hFxuICBpZiAodHgubG9nX2V2ZW50cyAmJiBBcnJheS5pc0FycmF5KHR4LmxvZ19ldmVudHMpKSB7XG4gICAgZm9yIChjb25zdCBldmVudCBvZiB0eC5sb2dfZXZlbnRzKSB7XG4gICAgICBpZiAoZXZlbnQuZGVjb2RlZD8ubmFtZSA9PT0gJ1RyYW5zZmVyJykge1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBldmVudC5kZWNvZGVkLnBhcmFtcztcbiAgICAgICAgY29uc3QgdHJhbnNmZXJGcm9tID0gcGFyYW1zLmZpbmQoKHA6IGFueSkgPT4gcC5uYW1lID09PSAnZnJvbScpPy52YWx1ZT8udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29uc3QgdHJhbnNmZXJUbyA9IHBhcmFtcy5maW5kKChwOiBhbnkpID0+IHAubmFtZSA9PT0gJ3RvJyk/LnZhbHVlPy50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcmFtcy5maW5kKChwOiBhbnkpID0+IHAubmFtZSA9PT0gJ3ZhbHVlJyk/LnZhbHVlO1xuXG4gICAgICAgIGlmICghdHJhbnNmZXJGcm9tIHx8ICF0cmFuc2ZlclRvIHx8ICF2YWx1ZSkgY29udGludWU7XG5cbiAgICAgICAgY29uc3QgdG9rZW5BbW91bnQgPSBldGhlcnMuZm9ybWF0VW5pdHModmFsdWUsIGV2ZW50LnNlbmRlcl9jb250cmFjdF9kZWNpbWFscyB8fCAxOCk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCB0b2tlbkRldGFpbHMgPSB7XG4gICAgICAgICAgdG9rZW46IGV2ZW50LnNlbmRlcl9jb250cmFjdF90aWNrZXJfc3ltYm9sIHx8ICdVbmtub3duJyxcbiAgICAgICAgICBhbW91bnQ6IHBhcnNlRmxvYXQodG9rZW5BbW91bnQpLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycsIHsgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiA0IH0pLFxuICAgICAgICAgIGxvZ286IGV2ZW50LnNlbmRlcl9sb2dvX3VybCxcbiAgICAgICAgICBjb250cmFjdF9hZGRyZXNzOiBldmVudC5zZW5kZXJfYWRkcmVzc1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0cmFuc2ZlckZyb20gPT09IGZyb21BZGRyZXNzICYmICFzZW50KSB7XG4gICAgICAgICAgc2VudCA9IHRva2VuRGV0YWlscztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHRyYW5zZmVyVG8gPT09IGZyb21BZGRyZXNzICYmICFyZWNlaXZlZCkge1xuICAgICAgICAgIHJlY2VpdmVkID0gdG9rZW5EZXRhaWxzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8g5qC55o2u6Kej5p6Q5Ye655qEIHNlbnQg5ZKMIHJlY2VpdmVkIOadpeehruWumuaTjeS9nOexu+Wei1xuICBsZXQgYWN0aW9uOiBTaW1wbGlmaWVkVHJhbnNhY3Rpb25bJ2FjdGlvbiddID0gJ090aGVyJztcbiAgaWYgKHNlbnQgJiYgcmVjZWl2ZWQpIHtcbiAgICBhY3Rpb24gPSAnU3dhcCc7XG4gIH0gZWxzZSBpZiAoc2VudCkge1xuICAgIGFjdGlvbiA9ICdUcmFuc2Zlcic7XG4gIH0gZWxzZSBpZiAodHgubG9nX2V2ZW50cyAmJiBBcnJheS5pc0FycmF5KHR4LmxvZ19ldmVudHMpICYmIHR4LmxvZ19ldmVudHMuc29tZSgoZTogYW55KSA9PiBlLmRlY29kZWQ/Lm5hbWUgPT09ICdBcHByb3ZhbCcpKSB7XG4gICAgYWN0aW9uID0gJ0FwcHJvdmFsJztcbiAgfVxuXG4gIC8vIOWvueS6jlN3YXDlkoxUcmFuc2Zlcu+8jOaIkeS7rOmcgOimgeWug+S7rOacieS7t+WAvOaJjeWxleekulxuICBpZiAoKGFjdGlvbiA9PT0gJ1N3YXAnIHx8IGFjdGlvbiA9PT0gJ1RyYW5zZmVyJykgJiYgKHR4LnZhbHVlX3F1b3RlID4gMSB8fCB0eC5nYXNfcXVvdGUgPiAwLjEpKSB7XG4gICAgIHJldHVybiB7XG4gICAgICB0eF9oYXNoOiB0eC50eF9oYXNoLFxuICAgICAgY2hhaW46IGNoYWluTmFtZSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUodHguYmxvY2tfc2lnbmVkX2F0KS5nZXRUaW1lKCksXG4gICAgICB1c2VyOiB1c2VyLFxuICAgICAgYWN0aW9uOiBhY3Rpb24sXG4gICAgICBzZW50OiBzZW50IHx8IHVuZGVmaW5lZCxcbiAgICAgIHJlY2VpdmVkOiByZWNlaXZlZCB8fCB1bmRlZmluZWQsXG4gICAgICB1c2RfdmFsdWU6IHR4LnZhbHVlX3F1b3RlXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5jb25zdCBkZWxheSA9IChtczogbnVtYmVyKSA9PiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcblxuLy8g5biu5Yqp5Ye95pWw77ya5LuOIEdvbGRSdXNoIOiOt+WPluWNleS4quWcsOWdgOWSjOmTvueahOS6pOaYk1xuYXN5bmMgZnVuY3Rpb24gZmV0Y2hUcmFuc2FjdGlvbnNGb3JDaGFpbihhZGRyZXNzOiBzdHJpbmcsIGNoYWluTmFtZTogc3RyaW5nLCB1c2VyOiBhbnkpIHtcbiAgaWYgKCFHT0xEUlVTSF9BUElfS0VZKSByZXR1cm4gW107XG5cbiAgY29uc3QgdXJsID0gYCR7R09MRFJVU0hfQVBJX0JBU0VfVVJMfS8ke2NoYWluTmFtZX0vYWRkcmVzcy8ke2FkZHJlc3N9L3RyYW5zYWN0aW9uc192My8/cXVvdGUtY3VycmVuY3k9VVNEJm5vLWxvZ3M9ZmFsc2UmcGFnZS1zaXplPTVgO1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICBoZWFkZXJzOiB7ICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke0dPTERSVVNIX0FQSV9LRVl9YCB9XG4gICAgfSk7XG5cbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBHb2xkUnVzaCBBUEkgZXJyb3IgZm9yICR7YWRkcmVzc30gb24gJHtjaGFpbk5hbWV9OmAsIGF3YWl0IHJlc3BvbnNlLnRleHQoKSk7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgaWYgKGRhdGEuZXJyb3IgfHwgIWRhdGEuZGF0YT8uaXRlbXMpIHtcbiAgICAgIC8vIEl0J3MgY29tbW9uIGZvciBhZGRyZXNzZXMgdG8gaGF2ZSBubyB0cmFuc2FjdGlvbnMsIHNvIHdlIGRvbid0IGxvZyBhbiBlcnJvciBmb3IgdGhhdC5cbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBwYXJzZWRUeHMgPSBkYXRhLmRhdGEuaXRlbXNcbiAgICAgIC5tYXAoKHR4OiBhbnkpID0+IHBhcnNlVHJhbnNhY3Rpb24odHgsIHVzZXIsIGNoYWluTmFtZSkpXG4gICAgICAuZmlsdGVyKCh0eDogU2ltcGxpZmllZFRyYW5zYWN0aW9uIHwgbnVsbCk6IHR4IGlzIFNpbXBsaWZpZWRUcmFuc2FjdGlvbiA9PiB0eCAhPT0gbnVsbCk7XG4gICAgICBcbiAgICByZXR1cm4gcGFyc2VkVHhzO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIGZldGNoIHRyYW5zYWN0aW9ucyBmcm9tIEdvbGRSdXNoIGZvciAke2FkZHJlc3N9IG9uICR7Y2hhaW5OYW1lfTpgLCBlKTtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChyZXE6IE5leHRSZXF1ZXN0KSB7XG4gIGlmICghR09MRFJVU0hfQVBJX0tFWSkge1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IG1lc3NhZ2U6IFwiR09MRFJVU0hfQVBJX0tFWSBpcyBub3Qgc2V0XCIgfSwgeyBzdGF0dXM6IDUwMCB9KTtcbiAgfVxuICBcbiAgY29uc3QgeyBzZWFyY2hQYXJhbXMgfSA9IG5ldyBVUkwocmVxLnVybCk7XG4gIGNvbnN0IGZpZFBhcmFtID0gc2VhcmNoUGFyYW1zLmdldCgnZmlkJyk7XG4gIGNvbnN0IGFkZHJlc3NQYXJhbSA9IHNlYXJjaFBhcmFtcy5nZXQoJ2FkZHJlc3MnKTtcblxuICBpZiAoIWZpZFBhcmFtICYmICFhZGRyZXNzUGFyYW0pIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBtZXNzYWdlOiBcImZpZCBvciBhZGRyZXNzIGlzIHJlcXVpcmVkXCIgfSwgeyBzdGF0dXM6IDQwMCB9KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgLy8gLS0tLSDliIbmlK8gMTog5oyJ6ZKx5YyF5Zyw5Z2A5p+l6K+iIC0tLS1cbiAgICBpZiAoYWRkcmVzc1BhcmFtKSB7XG4gICAgICBjb25zdCBhZGRyZXNzID0gYWRkcmVzc1BhcmFtLnRvTG93ZXJDYXNlKCk7XG4gICAgICBsZXQgdXNlciA9IHsgZmlkOiAwLCB1c2VybmFtZTogJ3Vua25vd24nLCBkaXNwbGF5X25hbWU6ICdVbmtub3duJywgcGZwX3VybDogJycgfTtcblxuICAgICAgLy8g5bCd6K+V5LuO5pWw5o2u5bqT5Lit5p+l5om+5LiO6K+l6ZKx5YyF5YWz6IGU55qE55So5oi35L+h5oGvXG4gICAgICBjb25zdCB7IGRhdGE6IHdhbGxldERhdGEgfSA9IGF3YWl0IHN1cGFiYXNlLmZyb20oJ3dhbGxldHMnKS5zZWxlY3QoJ3VzZXJfZmlkJykuZXEoJ2FkZHJlc3MnLCBhZGRyZXNzKS5zaW5nbGUoKTtcbiAgICAgIGlmICh3YWxsZXREYXRhPy51c2VyX2ZpZCkge1xuICAgICAgICBjb25zdCB7IGRhdGE6IHVzZXJEYXRhIH0gPSBhd2FpdCBzdXBhYmFzZS5mcm9tKCd1c2VycycpLnNlbGVjdCgnKicpLmVxKCdmaWQnLCB3YWxsZXREYXRhLnVzZXJfZmlkKS5zaW5nbGUoKTtcbiAgICAgICAgaWYgKHVzZXJEYXRhKSB7XG4gICAgICAgICAgdXNlciA9IHsgZmlkOiB1c2VyRGF0YS5maWQsIHVzZXJuYW1lOiB1c2VyRGF0YS51c2VybmFtZSwgZGlzcGxheV9uYW1lOiB1c2VyRGF0YS5kaXNwbGF5X25hbWUsIHBmcF91cmw6IHVzZXJEYXRhLnBmcF91cmwgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyDlkIzml7bmn6Xor6IgZXRoLW1haW5uZXQg5ZKMIG1vbmFkLXRlc3RuZXRcbiAgICAgIGNvbnN0IGV0aFR4cyA9IGF3YWl0IGZldGNoVHJhbnNhY3Rpb25zRm9yQ2hhaW4oYWRkcmVzcywgXCJldGgtbWFpbm5ldFwiLCB1c2VyKTtcbiAgICAgIGNvbnN0IG1vbmFkVHhzID0gYXdhaXQgZmV0Y2hUcmFuc2FjdGlvbnNGb3JDaGFpbihhZGRyZXNzLCBcIm1vbmFkLXRlc3RuZXRcIiwgdXNlcik7XG4gICAgICBjb25zdCB0cmFuc2FjdGlvbnMgPSBbLi4uZXRoVHhzLCAuLi5tb25hZFR4c107XG4gICAgICBcbiAgICAgIHRyYW5zYWN0aW9ucy5zb3J0KChhOiBTaW1wbGlmaWVkVHJhbnNhY3Rpb24sIGI6IFNpbXBsaWZpZWRUcmFuc2FjdGlvbikgPT4gYi50aW1lc3RhbXAgLSBhLnRpbWVzdGFtcCk7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24odHJhbnNhY3Rpb25zKTtcbiAgICB9XG5cbiAgICAvLyAtLS0tIOWIhuaUryAyOiDmjIkgRklEIOafpeivoiAtLS0tXG4gICAgaWYgKGZpZFBhcmFtKSB7XG4gICAgICBjb25zdCBzdHJlYW0gPSBuZXcgUmVhZGFibGVTdHJlYW0oe1xuICAgICAgICBhc3luYyBzdGFydChjb250cm9sbGVyKSB7XG4gICAgICAgICAgY29uc3QgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgICAgICAgIGNvbnN0IHB1c2hFdmVudCA9IChldmVudDogc3RyaW5nLCBkYXRhOiBvYmplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShlbmNvZGVyLmVuY29kZShgZXZlbnQ6ICR7ZXZlbnR9XFxuYCkpO1xuICAgICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKGVuY29kZXIuZW5jb2RlKGBkYXRhOiAke0pTT04uc3RyaW5naWZ5KGRhdGEpfVxcblxcbmApKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGZpZCA9IHBhcnNlSW50KGZpZFBhcmFtKTtcbiAgICAgICAgICAgIGxldCBjdXJzb3I6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgICAgICAgICAgbGV0IGFGb2xsb3dpbmdGb3VuZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgIC8vIDEuIOaMiemhteiOt+WPluWFs+azqOiAhVxuICAgICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IG5leW5hckNsaWVudC5mZXRjaFVzZXJGb2xsb3dpbmcoeyBmaWQsIGxpbWl0OiAxMDAsIGN1cnNvcjogY3Vyc29yID8/IHVuZGVmaW5lZCB9KTtcbiAgICAgICAgICAgICAgY29uc3QgZm9sbG93aW5nQmF0Y2ggPSByZXNwb25zZS51c2VycztcbiAgICAgICAgICAgICAgY3Vyc29yID0gcmVzcG9uc2UubmV4dC5jdXJzb3I7XG5cbiAgICAgICAgICAgICAgaWYgKGZvbGxvd2luZ0JhdGNoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBhRm9sbG93aW5nRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvbGxvd2luZ0ZpZHMgPSBmb2xsb3dpbmdCYXRjaC5tYXAoaXRlbSA9PiBpdGVtLnVzZXIuZmlkKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VyTWFwID0gbmV3IE1hcChmb2xsb3dpbmdCYXRjaC5tYXAoaXRlbSA9PiBbaXRlbS51c2VyLmZpZCwgaXRlbS51c2VyXSkpO1xuXG4gICAgICAgICAgICAgICAgLy8gMi4g6I635Y+W6K+l5om55qyh5YWz5rOo6ICF55qE6ZKx5YyFXG4gICAgICAgICAgICAgICAgY29uc3QgeyBkYXRhOiB3YWxsZXRzLCBlcnJvcjogZGJFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcbiAgICAgICAgICAgICAgICAgIC5mcm9tKCd3YWxsZXRzJylcbiAgICAgICAgICAgICAgICAgIC5zZWxlY3QoJ3VzZXJfZmlkLCBhZGRyZXNzJylcbiAgICAgICAgICAgICAgICAgIC5pbigndXNlcl9maWQnLCBmb2xsb3dpbmdGaWRzKTtcblxuICAgICAgICAgICAgICAgIGlmIChkYkVycm9yKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiU3VwYWJhc2UgZXJyb3IgZmV0Y2hpbmcgd2FsbGV0cyBmb3IgYSBiYXRjaDpcIiwgZGJFcnJvcik7XG4gICAgICAgICAgICAgICAgICBjb250aW51ZTsgLy8g6Lez6L+H5q2k5om55qyhXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgZXZtV2FsbGV0cyA9IHdhbGxldHMgPyB3YWxsZXRzLmZpbHRlcih3ID0+IHcuYWRkcmVzcy5zdGFydHNXaXRoKCcweCcpKSA6IFtdO1xuXG4gICAgICAgICAgICAgICAgLy8gMy4g5Li66K+l5om55qyh55qE5q+P5Liq6ZKx5YyF6I635Y+W5Lqk5piT5bm256uL5Y2z5o6o6YCBXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB3YWxsZXQgb2YgZXZtV2FsbGV0cykge1xuICAgICAgICAgICAgICAgICAgY29uc3QgdXNlciA9IHVzZXJNYXAuZ2V0KHdhbGxldC51c2VyX2ZpZCk7XG4gICAgICAgICAgICAgICAgICBpZiAoIXVzZXIpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgICBjb25zdCBldGhUeHMgPSBhd2FpdCBmZXRjaFRyYW5zYWN0aW9uc0ZvckNoYWluKHdhbGxldC5hZGRyZXNzLCBcImV0aC1tYWlubmV0XCIsIHVzZXIpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgbW9uYWRUeHMgPSBhd2FpdCBmZXRjaFRyYW5zYWN0aW9uc0ZvckNoYWluKHdhbGxldC5hZGRyZXNzLCBcIm1vbmFkLXRlc3RuZXRcIiwgdXNlcik7XG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9ucyA9IFsuLi5ldGhUeHMsIC4uLm1vbmFkVHhzXTtcbiAgICAgICAgICAgICAgICAgIGlmICh0cmFuc2FjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBwdXNoRXZlbnQoJ3RyYW5zYWN0aW9uJywgdHJhbnNhY3Rpb25zKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGF3YWl0IGRlbGF5KDI1MCk7IC8vIOWinuWKoOW7tuaXtuS7pemBv+WFjUFQSemZkOmAn1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSB3aGlsZSAoY3Vyc29yKTsgLy8gNC4g5aaC5p6c5pyJ5LiL5LiA6aG177yM5YiZ57un57ut5b6q546vXG5cbiAgICAgICAgICAgIGlmICghYUZvbGxvd2luZ0ZvdW5kKSB7XG4gICAgICAgICAgICAgIHB1c2hFdmVudCgnZG9uZScsIHsgbWVzc2FnZTogJ05vIG9uZSBmb2xsb3dlZC4nIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcHVzaEV2ZW50KCdkb25lJywgeyBtZXNzYWdlOiAnU3RyZWFtIGNvbXBsZXRlZCcgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJTdHJlYW1pbmcgZXJyb3I6XCIsIGVycm9yKTtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IChlcnJvciBhcyBhbnkpLm1lc3NhZ2UgfHwgJ0FuIHVua25vd24gZXJyb3Igb2NjdXJyZWQnO1xuICAgICAgICAgICAgcHVzaEV2ZW50KCdlcnJvcicsIHsgbWVzc2FnZTogXCJTdHJlYW1pbmcgZmFpbGVkXCIsIGVycm9yOiBlcnJvck1lc3NhZ2UgfSk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIuY2xvc2UoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShzdHJlYW0sIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAndGV4dC9ldmVudC1zdHJlYW0nLFxuICAgICAgICAgICdDYWNoZS1Db250cm9sJzogJ25vLWNhY2hlJyxcbiAgICAgICAgICAnQ29ubmVjdGlvbic6ICdrZWVwLWFsaXZlJyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH1cblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZmV0Y2ggdHJhbnNhY3Rpb25zOlwiLCBlcnJvcik7XG4gICAgY29uc3QgZXJyb3JNZXNzYWdlID0gKGVycm9yIGFzIGFueSkubWVzc2FnZSB8fCAnQW4gdW5rbm93biBlcnJvciBvY2N1cnJlZCc7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgbWVzc2FnZTogXCJGYWlsZWQgdG8gZmV0Y2ggdHJhbnNhY3Rpb25zXCIsIGVycm9yOiBlcnJvck1lc3NhZ2UgfSwgeyBzdGF0dXM6IDUwMCB9KTtcbiAgfVxuICBcbiAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgbWVzc2FnZTogXCJJbnZhbGlkIHJlcXVlc3RcIiB9LCB7IHN0YXR1czogNDAwIH0pO1xufSAiXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwiTmV5bmFyQVBJQ2xpZW50IiwiQ29uZmlndXJhdGlvbiIsInN1cGFiYXNlIiwiZXRoZXJzIiwicHJvY2VzcyIsImVudiIsIk5FWU5BUl9BUElfS0VZIiwiRXJyb3IiLCJuZXluYXJDbGllbnQiLCJhcGlLZXkiLCJHT0xEUlVTSF9BUElfS0VZIiwiR09MRFJVU0hfQVBJX0JBU0VfVVJMIiwicGFyc2VUcmFuc2FjdGlvbiIsInR4IiwidXNlciIsImNoYWluTmFtZSIsImZyb21BZGRyZXNzIiwiZnJvbV9hZGRyZXNzIiwidG9Mb3dlckNhc2UiLCJzZW50IiwicmVjZWl2ZWQiLCJsb2dfZXZlbnRzIiwiQXJyYXkiLCJpc0FycmF5IiwiZXZlbnQiLCJkZWNvZGVkIiwibmFtZSIsInBhcmFtcyIsInRyYW5zZmVyRnJvbSIsImZpbmQiLCJwIiwidmFsdWUiLCJ0cmFuc2ZlclRvIiwidG9rZW5BbW91bnQiLCJmb3JtYXRVbml0cyIsInNlbmRlcl9jb250cmFjdF9kZWNpbWFscyIsInRva2VuRGV0YWlscyIsInRva2VuIiwic2VuZGVyX2NvbnRyYWN0X3RpY2tlcl9zeW1ib2wiLCJhbW91bnQiLCJwYXJzZUZsb2F0IiwidG9Mb2NhbGVTdHJpbmciLCJtYXhpbXVtRnJhY3Rpb25EaWdpdHMiLCJsb2dvIiwic2VuZGVyX2xvZ29fdXJsIiwiY29udHJhY3RfYWRkcmVzcyIsInNlbmRlcl9hZGRyZXNzIiwiYWN0aW9uIiwic29tZSIsImUiLCJ2YWx1ZV9xdW90ZSIsImdhc19xdW90ZSIsInR4X2hhc2giLCJjaGFpbiIsInRpbWVzdGFtcCIsIkRhdGUiLCJibG9ja19zaWduZWRfYXQiLCJnZXRUaW1lIiwidW5kZWZpbmVkIiwidXNkX3ZhbHVlIiwiZGVsYXkiLCJtcyIsIlByb21pc2UiLCJyZXNvbHZlIiwic2V0VGltZW91dCIsImZldGNoVHJhbnNhY3Rpb25zRm9yQ2hhaW4iLCJhZGRyZXNzIiwidXJsIiwicmVzcG9uc2UiLCJmZXRjaCIsImhlYWRlcnMiLCJvayIsImNvbnNvbGUiLCJlcnJvciIsInRleHQiLCJkYXRhIiwianNvbiIsIml0ZW1zIiwicGFyc2VkVHhzIiwibWFwIiwiZmlsdGVyIiwiR0VUIiwicmVxIiwibWVzc2FnZSIsInN0YXR1cyIsInNlYXJjaFBhcmFtcyIsIlVSTCIsImZpZFBhcmFtIiwiZ2V0IiwiYWRkcmVzc1BhcmFtIiwiZmlkIiwidXNlcm5hbWUiLCJkaXNwbGF5X25hbWUiLCJwZnBfdXJsIiwid2FsbGV0RGF0YSIsImZyb20iLCJzZWxlY3QiLCJlcSIsInNpbmdsZSIsInVzZXJfZmlkIiwidXNlckRhdGEiLCJldGhUeHMiLCJtb25hZFR4cyIsInRyYW5zYWN0aW9ucyIsInNvcnQiLCJhIiwiYiIsInN0cmVhbSIsIlJlYWRhYmxlU3RyZWFtIiwic3RhcnQiLCJjb250cm9sbGVyIiwiZW5jb2RlciIsIlRleHRFbmNvZGVyIiwicHVzaEV2ZW50IiwiZW5xdWV1ZSIsImVuY29kZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJwYXJzZUludCIsImN1cnNvciIsImFGb2xsb3dpbmdGb3VuZCIsImZldGNoVXNlckZvbGxvd2luZyIsImxpbWl0IiwiZm9sbG93aW5nQmF0Y2giLCJ1c2VycyIsIm5leHQiLCJsZW5ndGgiLCJmb2xsb3dpbmdGaWRzIiwiaXRlbSIsInVzZXJNYXAiLCJNYXAiLCJ3YWxsZXRzIiwiZGJFcnJvciIsImluIiwiZXZtV2FsbGV0cyIsInciLCJzdGFydHNXaXRoIiwid2FsbGV0IiwiZXJyb3JNZXNzYWdlIiwiY2xvc2UiLCJSZXNwb25zZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/transactions/route.ts\n");

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
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/viem","vendor-chunks/next","vendor-chunks/@noble","vendor-chunks/tr46","vendor-chunks/ws","vendor-chunks/whatwg-url","vendor-chunks/node-gyp-build","vendor-chunks/webidl-conversions","vendor-chunks/utf-8-validate","vendor-chunks/bufferutil","vendor-chunks/@supabase","vendor-chunks/@neynar","vendor-chunks/semver","vendor-chunks/asynckit","vendor-chunks/math-intrinsics","vendor-chunks/ethers","vendor-chunks/es-errors","vendor-chunks/call-bind-apply-helpers","vendor-chunks/debug","vendor-chunks/get-proto","vendor-chunks/mime-db","vendor-chunks/has-symbols","vendor-chunks/gopd","vendor-chunks/function-bind","vendor-chunks/form-data","vendor-chunks/follow-redirects","vendor-chunks/axios","vendor-chunks/supports-color","vendor-chunks/proxy-from-env","vendor-chunks/ms","vendor-chunks/mime-types","vendor-chunks/hasown","vendor-chunks/has-tostringtag","vendor-chunks/has-flag","vendor-chunks/get-intrinsic","vendor-chunks/es-set-tostringtag","vendor-chunks/es-object-atoms","vendor-chunks/es-define-property","vendor-chunks/dunder-proto","vendor-chunks/delayed-stream","vendor-chunks/combined-stream"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftransactions%2Froute&page=%2Fapi%2Ftransactions%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftransactions%2Froute.ts&appDir=%2FUsers%2Farvin%2FDocuments%2FWork%20Local%2FThe%20Company%20Local%2FExternal%2FSignalCast%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Farvin%2FDocuments%2FWork%20Local%2FThe%20Company%20Local%2FExternal%2FSignalCast&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();