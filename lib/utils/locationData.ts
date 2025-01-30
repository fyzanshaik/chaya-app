import statesData from "../states.json";
import districtsData from "../districts.json";

export const states = statesData.states;

export const getDistricts = (state: string) => {
  return districtsData.districts
    .filter(district => district.state.toLowerCase() === state.toLowerCase())
    .map(district => district.district);
};
