

import React from 'react'
import API from '../../api/axios';

function LocationFetcher() {
 
  const [message , setMessage] = React.useState(null);
  const dummydata = [
  {
    "user": 14,
    "latitude": 21.20495,
    "longitude": 72.8408,
    "timestamp": "2025-08-01T12:00:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.204354,
    "longitude": 72.841895,
    "timestamp": "2025-08-01T12:00:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.203758,
    "longitude": 72.842991,
    "timestamp": "2025-08-01T12:01:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.203162,
    "longitude": 72.844086,
    "timestamp": "2025-08-01T12:01:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.202566,
    "longitude": 72.845181,
    "timestamp": "2025-08-01T12:02:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.20197,
    "longitude": 72.846276,
    "timestamp": "2025-08-01T12:02:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.201374,
    "longitude": 72.847372,
    "timestamp": "2025-08-01T12:03:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.200778,
    "longitude": 72.848467,
    "timestamp": "2025-08-01T12:03:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.200182,
    "longitude": 72.849562,
    "timestamp": "2025-08-01T12:04:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.199586,
    "longitude": 72.850657,
    "timestamp": "2025-08-01T12:04:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.19899,
    "longitude": 72.851753,
    "timestamp": "2025-08-01T12:05:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.198394,
    "longitude": 72.852848,
    "timestamp": "2025-08-01T12:05:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.197798,
    "longitude": 72.853943,
    "timestamp": "2025-08-01T12:06:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.197203,
    "longitude": 72.855038,
    "timestamp": "2025-08-01T12:06:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.196607,
    "longitude": 72.856134,
    "timestamp": "2025-08-01T12:07:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.196011,
    "longitude": 72.857229,
    "timestamp": "2025-08-01T12:07:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.195415,
    "longitude": 72.858324,
    "timestamp": "2025-08-01T12:08:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.194819,
    "longitude": 72.859419,
    "timestamp": "2025-08-01T12:08:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.194223,
    "longitude": 72.860515,
    "timestamp": "2025-08-01T12:09:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.193627,
    "longitude": 72.86161,
    "timestamp": "2025-08-01T12:09:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.193031,
    "longitude": 72.862705,
    "timestamp": "2025-08-01T12:10:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.192435,
    "longitude": 72.8638,
    "timestamp": "2025-08-01T12:10:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.191839,
    "longitude": 72.864896,
    "timestamp": "2025-08-01T12:11:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.191243,
    "longitude": 72.865991,
    "timestamp": "2025-08-01T12:11:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.190647,
    "longitude": 72.867086,
    "timestamp": "2025-08-01T12:12:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.190051,
    "longitude": 72.868181,
    "timestamp": "2025-08-01T12:12:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.189455,
    "longitude": 72.869277,
    "timestamp": "2025-08-01T12:13:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.188859,
    "longitude": 72.870372,
    "timestamp": "2025-08-01T12:13:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.188263,
    "longitude": 72.871467,
    "timestamp": "2025-08-01T12:14:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.187667,
    "longitude": 72.872562,
    "timestamp": "2025-08-01T12:14:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.187071,
    "longitude": 72.873658,
    "timestamp": "2025-08-01T12:15:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.186475,
    "longitude": 72.874753,
    "timestamp": "2025-08-01T12:15:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.185879,
    "longitude": 72.875848,
    "timestamp": "2025-08-01T12:16:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.185283,
    "longitude": 72.876943,
    "timestamp": "2025-08-01T12:16:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.184687,
    "longitude": 72.878039,
    "timestamp": "2025-08-01T12:17:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.184091,
    "longitude": 72.879134,
    "timestamp": "2025-08-01T12:17:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.183495,
    "longitude": 72.880229,
    "timestamp": "2025-08-01T12:18:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.182899,
    "longitude": 72.881324,
    "timestamp": "2025-08-01T12:18:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.182304,
    "longitude": 72.88242,
    "timestamp": "2025-08-01T12:19:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.181708,
    "longitude": 72.883515,
    "timestamp": "2025-08-01T12:19:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.181112,
    "longitude": 72.88461,
    "timestamp": "2025-08-01T12:20:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.180516,
    "longitude": 72.885705,
    "timestamp": "2025-08-01T12:20:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.17992,
    "longitude": 72.886801,
    "timestamp": "2025-08-01T12:21:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.179324,
    "longitude": 72.887896,
    "timestamp": "2025-08-01T12:21:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.178728,
    "longitude": 72.888991,
    "timestamp": "2025-08-01T12:22:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.178132,
    "longitude": 72.890086,
    "timestamp": "2025-08-01T12:22:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.177536,
    "longitude": 72.891182,
    "timestamp": "2025-08-01T12:23:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.17694,
    "longitude": 72.892277,
    "timestamp": "2025-08-01T12:23:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.176344,
    "longitude": 72.893372,
    "timestamp": "2025-08-01T12:24:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.175748,
    "longitude": 72.894467,
    "timestamp": "2025-08-01T12:24:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.175152,
    "longitude": 72.895563,
    "timestamp": "2025-08-01T12:25:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.174556,
    "longitude": 72.896658,
    "timestamp": "2025-08-01T12:25:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.17396,
    "longitude": 72.897753,
    "timestamp": "2025-08-01T12:26:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.173364,
    "longitude": 72.898848,
    "timestamp": "2025-08-01T12:26:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.172768,
    "longitude": 72.899944,
    "timestamp": "2025-08-01T12:27:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.172172,
    "longitude": 72.901039,
    "timestamp": "2025-08-01T12:27:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.171576,
    "longitude": 72.902134,
    "timestamp": "2025-08-01T12:28:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.17098,
    "longitude": 72.903229,
    "timestamp": "2025-08-01T12:28:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.170384,
    "longitude": 72.904325,
    "timestamp": "2025-08-01T12:29:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.169788,
    "longitude": 72.90542,
    "timestamp": "2025-08-01T12:29:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.169192,
    "longitude": 72.906515,
    "timestamp": "2025-08-01T12:30:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.168596,
    "longitude": 72.90761,
    "timestamp": "2025-08-01T12:30:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.168001,
    "longitude": 72.908706,
    "timestamp": "2025-08-01T12:31:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.167405,
    "longitude": 72.909801,
    "timestamp": "2025-08-01T12:31:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.166809,
    "longitude": 72.910896,
    "timestamp": "2025-08-01T12:32:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.166213,
    "longitude": 72.911991,
    "timestamp": "2025-08-01T12:32:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.165617,
    "longitude": 72.913087,
    "timestamp": "2025-08-01T12:33:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.165021,
    "longitude": 72.914182,
    "timestamp": "2025-08-01T12:33:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.164425,
    "longitude": 72.915277,
    "timestamp": "2025-08-01T12:34:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.163829,
    "longitude": 72.916372,
    "timestamp": "2025-08-01T12:34:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.163233,
    "longitude": 72.917468,
    "timestamp": "2025-08-01T12:35:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.162637,
    "longitude": 72.918563,
    "timestamp": "2025-08-01T12:35:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.162041,
    "longitude": 72.919658,
    "timestamp": "2025-08-01T12:36:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.161445,
    "longitude": 72.920753,
    "timestamp": "2025-08-01T12:36:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.160849,
    "longitude": 72.921849,
    "timestamp": "2025-08-01T12:37:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.160253,
    "longitude": 72.922944,
    "timestamp": "2025-08-01T12:37:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.159657,
    "longitude": 72.924039,
    "timestamp": "2025-08-01T12:38:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.159061,
    "longitude": 72.925134,
    "timestamp": "2025-08-01T12:38:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.158465,
    "longitude": 72.92623,
    "timestamp": "2025-08-01T12:39:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.157869,
    "longitude": 72.927325,
    "timestamp": "2025-08-01T12:39:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.157273,
    "longitude": 72.92842,
    "timestamp": "2025-08-01T12:40:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.156677,
    "longitude": 72.929515,
    "timestamp": "2025-08-01T12:40:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.156081,
    "longitude": 72.930611,
    "timestamp": "2025-08-01T12:41:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.155485,
    "longitude": 72.931706,
    "timestamp": "2025-08-01T12:41:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.154889,
    "longitude": 72.932801,
    "timestamp": "2025-08-01T12:42:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.154293,
    "longitude": 72.933896,
    "timestamp": "2025-08-01T12:42:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.153697,
    "longitude": 72.934992,
    "timestamp": "2025-08-01T12:43:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.153102,
    "longitude": 72.936087,
    "timestamp": "2025-08-01T12:43:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.152506,
    "longitude": 72.937182,
    "timestamp": "2025-08-01T12:44:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.15191,
    "longitude": 72.938277,
    "timestamp": "2025-08-01T12:44:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.151314,
    "longitude": 72.939373,
    "timestamp": "2025-08-01T12:45:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.150718,
    "longitude": 72.940468,
    "timestamp": "2025-08-01T12:45:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.150122,
    "longitude": 72.941563,
    "timestamp": "2025-08-01T12:46:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.149526,
    "longitude": 72.942658,
    "timestamp": "2025-08-01T12:46:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.14893,
    "longitude": 72.943754,
    "timestamp": "2025-08-01T12:47:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.148334,
    "longitude": 72.944849,
    "timestamp": "2025-08-01T12:47:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.147738,
    "longitude": 72.945944,
    "timestamp": "2025-08-01T12:48:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.147142,
    "longitude": 72.947039,
    "timestamp": "2025-08-01T12:48:30+05:30"
  },
  {
    "user": 14,
    "latitude": 21.146546,
    "longitude": 72.948135,
    "timestamp": "2025-08-01T12:49:00+05:30"
  },
  {
    "user": 14,
    "latitude": 21.14595,
    "longitude": 72.94923,
    "timestamp": "2025-08-01T12:49:30+05:30"
  }
];


const postDummyLocations = async () => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    setMessage("No access token. Please login.");
    return;
  }

  try {
    for (const loc of dummydata) {
      await API.post("/locations/", loc, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
    setMessage(" Dummy location data posted successfully.");
  } catch (error: any) {
    console.error("Error posting dummy data:", error);
    setMessage("❌ Failed to post dummy data.");
  }
};


  return (
    <div>

      <button
  type="button"
  onClick={postDummyLocations}
  className="mt-4 w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
>
  🧪 Post Dummy Location Data
</button>

      
    </div>
  )
}

export default LocationFetcher
