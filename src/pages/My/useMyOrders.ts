import { useEffect, useState } from "react"
import { last } from "ramda"
import { UUSD } from "../../constants"
import useContractQuery from "../../graphql/useContractQuery"
import { useContractsAddress, useContract, useNetwork } from "../../hooks"
import { useCombineKeys, useWallet } from "../../hooks"
import { PriceKey } from "../../hooks/contractKeys"
import { div, sum, times } from "../../libs/math"
import { Type } from "../Trade"

const useMyOrders = () => {
  const priceKey = PriceKey.PAIR
  const keys = [priceKey]

  const { loading: loadingPrice } = useCombineKeys(keys)
  const { parseToken } = useContractsAddress()
  const { find } = useContract()
  const { result, orders, more } = useQueryOrders()
  const { loading: loadingOrders } = result
  const loading = loadingOrders || loadingPrice

  const dataSource = orders.map((order) => {
    const { offer_asset, ask_asset } = order

    const offerAsset = parseToken(offer_asset)
    const askAsset = parseToken(ask_asset)

    const type = offerAsset.token === UUSD ? Type.BUY : Type.SELL

    const limitOrderPrice = {
      [Type.BUY]: div(offerAsset.amount, askAsset.amount),
      [Type.SELL]: div(askAsset.amount, offerAsset.amount),
    }[type]

    const terraswapPrice = {
      [Type.BUY]: find(priceKey, askAsset.token),
      [Type.SELL]: find(priceKey, offerAsset.token),
    }[type]

    const offerPrice = find(priceKey, offerAsset.token)
    const offerValue = times(offerPrice, offerAsset.amount)

    return {
      ...order,
      offerAsset,
      askAsset,
      limitOrderPrice,
      terraswapPrice,
      offerValue,
    }
  })

  const total = sum(dataSource.map(({ offerValue }) => offerValue))

  return { keys, loading, dataSource, total, more }
}

export default useMyOrders

/* query */
const LIMIT = 30
export const useQueryOrders = () => {
  const { limitOrder = "" } = useNetwork()
  const { address } = useWallet()

  const [orders, setOrders] = useState<Order[]>([])
  const [offset, setOffset] = useState<number>()
  const [done, setDone] = useState(true)

  const query = useContractQuery<{ orders: Order[] }>({
    contract: limitOrder,
    msg: {
      orders: { bidder_addr: address, limit: LIMIT, start_after: offset },
    },
  })

  const { parsed } = query

  useEffect(() => {
    if (parsed) {
      setOrders((prev) => [...prev, ...parsed.orders])
      setDone(parsed.orders.length < LIMIT)
    }

    // eslint-disable-next-line
  }, [JSON.stringify(parsed)])

  const more = done ? undefined : () => setOffset(last(orders)?.order_id)

  return { ...query, orders, more }
}

export const useQueryOrder = (id: number) => {
  const { limitOrder = "" } = useNetwork()

  return useContractQuery<Order>({
    contract: limitOrder,
    msg: { order: { order_id: id } },
  })
}
