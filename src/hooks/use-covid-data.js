import dayjs from "dayjs";
import bind from "lodash/bind";
import drop from "lodash/fp/drop";
import flow from "lodash/fp/flow";
import groupBy from "lodash/fp/groupBy";
import identity from "lodash/fp/identity";
import keyBy from "lodash/fp/keyBy";
import keys from "lodash/fp/keys";
import map from "lodash/fp/map";
import mapKeys from "lodash/fp/mapKeys";
import mapValues from "lodash/fp/mapValues";
import pick from "lodash/fp/pick";
import pickBy from "lodash/fp/pickBy";
import propertyOf from "lodash/fp/propertyOf";
import sortBy from "lodash/fp/sortBy";
import sortedUniq from "lodash/fp/sortedUniq";
import uniq from "lodash/fp/uniq";
import indexOf from "lodash/indexOf";
import set from "lodash/set";
import { useEffect, useState } from "react";

const IT_TO_EN = {
  data: "date",
  denominazione_regione: "region",
  totale_casi: "totalCases",
};

const pickByKey = (predicate) => pickBy((_, key) => predicate(key));

const mapPropValue = (propName, mapFn) => (obj) => ({
  ...obj,
  [propName]: mapFn(obj[propName]),
});

const withMinimum = (minimum) => (val) => Math.max(minimum, val);

const useCovidData = (daysDelay = 1) => {
  const [covidData, setCovidData] = useState({ loading: true });

  useEffect(() => {
    (async () => {
      const rawData = await (
        await fetch(
          "https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-regioni.json"
        )
      ).json();

      const data = map(
        flow(
          pick(keys(IT_TO_EN)),
          mapKeys(propertyOf(IT_TO_EN)),
          mapPropValue("totalCases", withMinimum(1))
        )
      )(rawData);

      const origDates = flow(map("date"), uniq, sortBy(identity))(data);
      const dates = flow(
        drop(daysDelay),
        map((d) => dayjs(d).format("MMMM D YYYY"))
      )(origDates);
      const regions = flow(map("region"), sortBy(identity), sortedUniq)(data);

      let byRegionAndDate = flow(
        groupBy("region"),
        mapValues(keyBy("date"))
      )(data);
      const calcNewCases = ({ region, date, totalCases }) =>
        totalCases -
        byRegionAndDate[region][origDates[indexOf(origDates, date) - 7]]
          .totalCases;

      byRegionAndDate = mapValues(
        flow(
          mapKeys((d) => dayjs(d).format("MMMM D YYYY")),
          pickByKey(bind(dates.includes, dates)),
          mapValues(
            flow(
              (val) => set(val, "newCases", calcNewCases(val)),
              mapPropValue("newCases", withMinimum(1))
            )
          )
        )
      )(byRegionAndDate);
      setCovidData({ byRegionAndDate, regions, dates, loading: false });
    })();
  }, [daysDelay]);

  return covidData;
};

export default useCovidData;
