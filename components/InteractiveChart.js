import { useEffect, useRef } from "react";

function InteractiveChart(props) {
    const chartContainer = useRef(null);

    useEffect(function () {
        if (chartContainer.current) {
            let chart = document.pyodideMplTarget.childNodes[props.chartIndex];
            if (!chart) {
                console.error("Could not find the chart element");
                return;
            }

            if (!chart.getAttribute("data-index")) {
                chart.setAttribute("data-index", props.chartIndex);
            }

            chartContainer.current.appendChild(chart);
            let elementChart = chartContainer.current.querySelector(`[data-index="${props.chartIndex}"]`);

            return function () {
                if (elementChart) {
                    let appendAtIndex = parseInt(elementChart.getAttribute("data-index"));
                    if (document.pyodideMplTarget.childNodes.length === appendAtIndex) {
                        document.pyodideMplTarget.appendChild(elementChart);
                    } else {
                        document.pyodideMplTarget.insertBefore(elementChart, document.pyodideMplTarget.childNodes[appendAtIndex]);
                    }
                }
            }
        }
    }, [chartContainer]);

    return <div className="max-h-[90vh] overflow-y-auto">
        <div ref={chartContainer}></div>
    </div>
}

export default InteractiveChart;
