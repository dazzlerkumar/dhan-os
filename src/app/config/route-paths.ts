interface PathsConfig {
  auth: {
    login: string;
  };
  main: {
    dashboard: string;
    transactions: string;
    cards: string;
    goals: string;
    reports: string;
    notifications: string;
    settings: string;
  };
}

const pathsConfig: PathsConfig = {
  auth: {
    login: "/login",
  },
  main: {
    dashboard: "/",
    transactions: "/transactions",
    cards: "/cards",
    goals: "/goals",
    reports: "/reports",
    notifications: "/notifications",
    settings: "/settings",
  },
};

export default pathsConfig;
