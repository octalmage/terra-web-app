import { UST, UUSD } from "../../constants"
import MESSAGE from "../../lang/MESSAGE.json"
import { format, formatAsset } from "../../libs/parse"
import { getPath, MenuKey } from "../../routes"

import Card from "../../components/Card"
import Table from "../../components/Table"
import Dl from "../../components/Dl"
import DashboardActions from "../../components/DashboardActions"
import NoAssets from "./NoAssets"

interface OrderDetails extends Order {
  offerAsset: Asset
  askAsset: Asset
  targetPrice: string
  currentPrice: string
}

interface Props {
  loading: boolean
  total: string
  dataSource: OrderDetails[]
}

const Orders = ({ loading, dataSource, ...props }: Props) => {
  const { total } = props

  const dataExists = !!dataSource.length
  const description = dataExists && (
    <Dl
      list={[{ title: "Total Order Value", content: formatAsset(total, UUSD) }]}
    />
  )

  return (
    <Card title="Limit Orders" description={description} loading={loading}>
      {dataExists ? (
        <Table
          columns={[
            {
              key: "order_id",
              title: "ID",
              bold: true,
            },
            {
              key: "offerAsset",
              title: "Offer Asset",
              render: ({ amount, symbol }) => formatAsset(amount, symbol),
              align: "right",
            },
            {
              key: "askAsset",
              title: "Ask Asset",
              render: ({ amount, symbol }) => formatAsset(amount, symbol),
              align: "right",
            },
            {
              key: "targetPrice",
              title: "Target Price",
              render: (value) => `${format(value)} ${UST}`,
              align: "right",
            },
            {
              key: "currentPrice",
              title: "Current Price",
              render: (value) => `${format(value)} ${UST}`,
              align: "right",
            },
            {
              key: "actions",
              dataIndex: "order_id",
              render: (id) => (
                <DashboardActions
                  list={[
                    {
                      to: [getPath(MenuKey.LIMIT), id].join("/"),
                      children: "Cancel",
                    },
                  ]}
                />
              ),
              align: "right",
              fixed: "right",
            },
          ]}
          dataSource={dataSource}
        />
      ) : (
        !loading && (
          <NoAssets
            description={MESSAGE.MyPage.Empty.Orders}
            link={MenuKey.TRADE}
          />
        )
      )}
    </Card>
  )
}

export default Orders
