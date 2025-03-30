import { Switch, Route } from "wouter";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Goals from "@/pages/Goals";
import Resume from "@/pages/Resume";
import CoverLetter from "@/pages/CoverLetter";
import Interview from "@/pages/Interview";
import WorkHistory from "@/pages/WorkHistory";
import Achievements from "@/pages/Achievements";
import AICoach from "@/pages/AICoach";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/goals" component={Goals} />
        <Route path="/resume" component={Resume} />
        <Route path="/cover-letter" component={CoverLetter} />
        <Route path="/interviews" component={Interview} />
        <Route path="/work-history" component={WorkHistory} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/ai-coach" component={AICoach} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default App;
