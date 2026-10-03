export default {
  name: "ping_tool",
  description: "Returns a simple confirmation that the SiteScoop tool system is operational.",
  parameters: {
    type: "OBJECT",
    properties: {},
  },
  execute: async (args) => {
    return {
      success: true,
      message: "SiteScoop tool system is operational."
    };
  }
};
