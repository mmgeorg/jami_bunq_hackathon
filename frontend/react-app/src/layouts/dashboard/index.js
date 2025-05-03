import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

// Example data (replace with dynamic props or state as needed)
const spendingBarData = {
  labels: ["Groceries", "Dining", "Transport", "Utilities", "Subscriptions"],
  datasets: { label: "€", data: [320, 210, 150, 90, 60] },
};

const savingsLineData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: { label: "Savings", data: [120, 140, 180, 200, 230, 250] },
};

function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="dark"
                icon="savings"
                title="This Month's Savings"
                count="€180"
                percentage={{
                  color: "success",
                  amount: "+€45",
                  label: "vs last month",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                icon="credit_card"
                title="Total Spending"
                count="€2,220"
                percentage={{
                  color: "error",
                  amount: "+12%",
                  label: "more than last month",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="emoji_events"
                title="Goal Progress"
                count="35%"
                percentage={{
                  color: "info",
                  amount: "",
                  label: "Car Fund: €3,500 / €10,000",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="primary"
                icon="trending_up"
                title="Portfolio Value"
                count="€6,300"
                percentage={{
                  color: "success",
                  amount: "+7%",
                  label: "1Y growth estimate",
                }}
              />
            </MDBox>
          </Grid>
        </Grid>

        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={6}>
              <MDBox mb={3}>
                <ReportsBarChart
                  color="info"
                  title="Spending by Category"
                  description="This month"
                  date="updated 2 min ago"
                  chart={spendingBarData}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={6}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="success"
                  title="Monthly Savings Trend"
                  description="Steady growth over last 6 months"
                  date="updated just now"
                  chart={savingsLineData}
                />
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}
export default Dashboard;
