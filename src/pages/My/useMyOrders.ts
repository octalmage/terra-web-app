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
  const loading = result.loading || loadingPrice

  const dataSource = !parsed
    ? []
    : parsed?.orders.map((order) => {
        const { offer_asset, ask_asset } = order
        const offer = parseToken(offer_asset)
        const ask = parseToken(ask_asset)

        const type = offer.token === UUSD ? Type.BUY : Type.SELL

        const orderAsset = { [Type.BUY]: ask, [Type.SELL]: offer }[type]
        const offerAsset = { [Type.BUY]: offer, [Type.SELL]: ask }[type]

        const currentPrice = find(priceKey, orderAsset.token)

        const offerPrice = find(priceKey, offer.token)
        const offerValue = times(offerPrice, offer.amount)

        const targetPrice = {
          [Type.BUY]: div(offer.amount, ask.amount),
          [Type.SELL]: div(ask.amount, offer.amount),
        }[type]

        return {
          ...order,
          type,
          orderAsset,
          offerAsset,
          targetPrice,
          currentPrice,
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
