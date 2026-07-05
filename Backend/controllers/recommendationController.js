import {
  getPersonalizedRecommendations,
  getTripBasedRecommendations,
  getDestinationBasedRecommendations
} from "../services/recommendationService.js";

export const getUserRecommendations = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId parameter is required." });
    }
    const recommendations = await getPersonalizedRecommendations(userId);
    res.status(200).json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTripRecommendations = async (req, res) => {
  try {
    const { tripId } = req.params;
    if (!tripId) {
      return res.status(400).json({ success: false, message: "tripId parameter is required." });
    }
    const recommendations = await getTripBasedRecommendations(tripId);
    res.status(200).json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDestinationRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "destinationId parameter is required." });
    }
    const recommendations = await getDestinationBasedRecommendations(id);
    res.status(200).json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
