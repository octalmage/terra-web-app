import { useEffect } from "react"
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
  const { parsed, result } = useQueryOrders()
  const { loading: loadingOrders, refetch } = result
  const loading = loadingOrders || loadingPrice

  useEffect(() => {
    refetch()
  }, [refetch])

  const dataSource = !parsed
    ? []
    : parsed?.orders.map((order) => {
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

  return { keys, loading, dataSource, total }
}

export default useMyOrders

/* query */
export const useQueryOrders = () => {
  const { limitOrder = "" } = useNetwork()
  const { address } = useWallet()

  return useContractQuery<{ orders: Order[] }>({
    contract: limitOrder,
    msg: { orders: { bidder_addr: address } },
  })
}

export const useQueryOrder = (id: number) => {
  const { limitOrder = "" } = useNetwork()

  return useContractQuery<Order>({
    contract: limitOrder,
    msg: { order: { order_id: id } },
  })
}
