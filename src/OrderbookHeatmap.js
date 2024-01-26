import React, { useState, useEffect } from "react";
import "./OrderbookHeatmap.css";

const OrderbookHeatmap = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [orderbookData, setOrderbookData] = useState({ bids: [], asks: [] });
	const [groupSize, setGroupSize] = useState(0.05);
	const [latestPrice, setLatestPrice] = useState(0);
	const [maxTotal, setMaxTotal] = useState(0);

	useEffect(() => {
		const fetchData = async () => {
			const response = await fetch(
				process.env.PUBLIC_URL + "/filteredData.json"
			);
			const data = await response.json();
			let localMaxTotal = 0;
			let bids = {},
				asks = {};
			data.forEach((item) => {
				const priceGroup =
					Math.floor(item.price / groupSize) * groupSize;
				const collection = item.side === "ask" ? asks : bids;
				collection[priceGroup] = collection[priceGroup] || {
					amount: 0,
					total: 0,
				};
				collection[priceGroup].amount += item.amount;

				if (
					item.side === "ask" &&
					(latestPrice === 0 || item.price < latestPrice)
				) {
					setLatestPrice(item.price);
				}
			});

			const calculateTotals = (orders) => {
				let total = 0;
				return Object.entries(orders)
					.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
					.map(([price, { amount }]) => {
						total += amount;
						if (total > localMaxTotal) {
							localMaxTotal = total;
						}
						return { price: parseFloat(price), amount, total };
					});
			};

			setOrderbookData({
				bids: calculateTotals(bids),
				asks: calculateTotals(asks),
			});
			setMaxTotal(localMaxTotal);
			setIsLoading(false);
		};

		fetchData();
	}, [groupSize, latestPrice]);

	const handleGroupSizeChange = (e) => {
		setGroupSize(Number(e.target.value));
		setIsLoading(true);
	};

	const depthStyle = (total, isBid) => {
		const depthPercentage = (total / maxTotal) * 100;
        const color = total > 0 ? (isBid ? "#00A300" : "#FF3333") : "#ccc";
        return {
            background: `linear-gradient(to ${isBid ? "left" : "right"}, ${color} ${depthPercentage}%, transparent 0%)`,
          };
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="orderbook-heatmap">
			<select value={groupSize} onChange={handleGroupSizeChange}>
				<option value={0.05}>0.05</option>
				<option value={0.1}>0.1</option>
				<option value={0.25}>0.25</option>
			</select>
			<div className="data-table">
				<div className="bids">
					<h2>Bids</h2>
					<div className="header">
						<span>Price</span>
						<span>Amount</span>
						<span>Total</span>
					</div>
					{orderbookData.bids.map(
						({ price, amount, total }, index) => (
							<div key={index} className="order-row">
								<div
									className="depth-overlay"
									style={depthStyle(total, true)}
								></div>
								<span>{price.toFixed(2)}</span>
								<span>{amount.toFixed(2)}</span>
								<span>{total.toFixed(2)}</span>
							</div>
						)
					)}
				</div>
				<div className="latest-price">
					Latest Price: {latestPrice.toFixed(2)}
				</div>
				<div className="asks">
					<h2>Asks</h2>
					<div className="header">
						<span>Price</span>
						<span>Amount</span>
						<span>Total</span>
					</div>
					{orderbookData.asks.map(
						({ price, amount, total }, index) => (
							<div key={index} className="order-row">
								<div
									className="depth-overlay"
									style={depthStyle(total, false)}
								></div>
								<span>{price.toFixed(2)}</span>
								<span>{amount.toFixed(2)}</span>
								<span>{total.toFixed(2)}</span>
							</div>
						)
					)}
				</div>
			</div>
		</div>
	);
};

export default OrderbookHeatmap;
