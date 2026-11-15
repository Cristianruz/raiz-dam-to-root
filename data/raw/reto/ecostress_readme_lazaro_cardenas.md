# AppEEARS Point Sample Extraction Readme  

## Table of Contents  

1. Request Parameters  
2. Request File Listing  
3. Point Sample Extraction Process  
4. Data Quality  
    4.1. Moderate Resolution Imaging Spectroradiometer (MODIS)  
    4.2. NASA MEaSUREs Shuttle Radar Topography Mission (SRTM) Version 3 (v3)  
    4.3. NASA Visible Infrared Imaging Radiometer Suite (VIIRS)  
    4.4. Soil Moisture Active Passive (SMAP)  
    4.5. Daymet (v4R1)
    4.6. Ecosystem Spaceborne Thermal Radiometer Experiment on Space Station (ECOSTRESS)  
    4.6.1. Ecosystem Spaceborne Thermal Radiometer Experiment on Space Station (ECOSTRESS) Swath V2  
    4.6.2. Ecosystem Spaceborne Thermal Radiometer Experiment on Space Station (ECOSTRESS) Tiled V2
    4.7. Advanced Spaceborne Thermal Emission and Reflection Radiometer (ASTER) Global Digital Elevation Model (GDEM) Version 3 (v3) and Global Water Bodies Database (WBD) Version 1 (v1)  
    4.8. NASA MEaSUREs NASA Digital Elevation Model (DEM) Version 1 (v1)  
    4.9. Harmonized Landsat Sentinel-2 (HLS) Version 2.0
    4.10. Landsat Collection 2 (C2) U.S. Analysis Ready Data (ARD)  
    4.11. US National Park Service (NPS) Historical Water Balance for the Continental United States (CONUS)
    4.12. Earth surface Mineral dust source InvesTigation (EMIT) L1B Radiance and L2A Reflectance Collections
    4.13. Earth surface Mineral dust source InvesTigation (EMIT) L2B Estimated Mineral Identification, Band Depth and Uncertainty Collection
    4.14. Plankton, Aerosol, Cloud, ocean Ecosystem (PACE) Ocean Color (OCI) Level-3 Global Mapped Data
    4.15. National Land Cover Database (NLCD)
5. Data Caveats  
6. Documentation  
7. Sample Request Retention  
8. Data Product Citations  
9. Software Citation  
10. Feedback  

## 1. Request Parameters  

    Name: raiz_ecostress_lazaro_cardenas  

    Date Completed: 2026-11-15T02:32:35.255642  

    ID: 520f1233-5eb1-4c4e-b243-2c43940f784b  

    Details:  

        Start Date: 10-01-2025  

        End Date: 09-30-2026
    
        Layers:  

            ETdaily (ECO_L3T_JET.002)  
            ETinstUncertainty (ECO_L3T_JET.002)  
            cloud (ECO_L3T_JET.002)  
            water (ECO_L3T_JET.002)  
    
        Coordinates:  

            L0001, lazarocardenas, 28.429525, -105.57189  
            L0002, lazarocardenas, 28.429255, -105.643975  
            L0003, lazarocardenas, 28.4289, -105.578423  
            L0004, lazarocardenas, 28.428725, -105.6404  
            L0005, lazarocardenas, 28.42859, -105.567565  
            L0006, lazarocardenas, 28.42908, -105.589495  
            L0007, lazarocardenas, 28.42868, -105.618032  
            L0008, lazarocardenas, 28.42854, -105.56138  
            L0009, lazarocardenas, 28.428815, -105.592775  
            L0010, lazarocardenas, 28.428095, -105.5635  
            L0011, lazarocardenas, 28.42799, -105.560285  
            L0012, lazarocardenas, 28.42724, -105.599413  
            L0013, lazarocardenas, 28.426745, -105.651202  
            L0014, lazarocardenas, 28.427195, -105.597006  
            L0015, lazarocardenas, 28.42679, -105.584015  
            L0016, lazarocardenas, 28.426655, -105.590374  
            L0017, lazarocardenas, 28.426565, -105.56138  
            L0018, lazarocardenas, 28.42589, -105.56461  
            L0019, lazarocardenas, 28.425935, -105.568295  
            L0020, lazarocardenas, 28.42441, -105.58068  
            L0021, lazarocardenas, 28.424185, -105.642907  
            L0022, lazarocardenas, 28.424275, -105.57063  
            L0023, lazarocardenas, 28.423785, -105.56096  
            L0024, lazarocardenas, 28.42257, -105.564768  
            L0025, lazarocardenas, 28.422435, -105.58415  
            L0026, lazarocardenas, 28.421895, -105.589842  
            L0027, lazarocardenas, 28.42212, -105.562341  
            L0028, lazarocardenas, 28.42203, -105.567891  
            L0029, lazarocardenas, 28.421985, -105.575513  
            L0030, lazarocardenas, 28.421985, -105.5606  
            L0031, lazarocardenas, 28.420005, -105.576754  
            L0032, lazarocardenas, 28.419375, -105.600248  
            L0033, lazarocardenas, 28.419465, -105.5606  
            L0034, lazarocardenas, 28.415875, -105.652359  
            L0035, lazarocardenas, 28.41906, -105.563288  
            L0036, lazarocardenas, 28.418255, -105.582506  
            L0037, lazarocardenas, 28.41848, -105.567911  
            L0038, lazarocardenas, 28.41852, -105.587047  
            L0039, lazarocardenas, 28.418655, -105.57157  
            L0040, lazarocardenas, 28.41879, -105.61968  
            L0041, lazarocardenas, 28.41718, -105.577298  
            L0042, lazarocardenas, 28.41718, -105.610582  
            L0043, lazarocardenas, 28.415785, -105.59426  
            L0044, lazarocardenas, 28.41538, -105.58837  
            L0045, lazarocardenas, 28.41502, -105.563025  
            L0046, lazarocardenas, 28.4143, -105.638048  
            L0047, lazarocardenas, 28.41417, -105.574315  
            L0048, lazarocardenas, 28.414305, -105.567884  
            L0049, lazarocardenas, 28.41457, -105.578963  
            L0050, lazarocardenas, 28.414035, -105.583272  
            L0051, lazarocardenas, 28.41466, -105.621655  
            L0052, lazarocardenas, 28.414075, -105.58662  
            L0053, lazarocardenas, 28.41412, -105.59072  
            L0054, lazarocardenas, 28.41363, -105.592454  
            L0055, lazarocardenas, 28.413225, -105.625201  
            L0056, lazarocardenas, 28.41372, -105.644762  
            L0057, lazarocardenas, 28.413095, -105.618491  
            L0058, lazarocardenas, 28.41363, -105.58837  
            L0059, lazarocardenas, 28.41179, -105.567395  
            L0060, lazarocardenas, 28.41269, -105.634005  
            L0061, lazarocardenas, 28.411205, -105.57415  
            L0062, lazarocardenas, 28.411835, -105.579435  
            L0063, lazarocardenas, 28.41116, -105.570247  
            L0064, lazarocardenas, 28.41098, -105.560847  
            L0065, lazarocardenas, 28.411475, -105.635469  
            L0066, lazarocardenas, 28.41026, -105.644809  
            L0067, lazarocardenas, 28.41036, -105.564029  
            L0068, lazarocardenas, 28.41008, -105.587835  
            L0069, lazarocardenas, 28.409585, -105.58451  
            L0070, lazarocardenas, 28.409185, -105.589585  
            L0071, lazarocardenas, 28.40954, -105.586665  
            L0072, lazarocardenas, 28.408915, -105.593511  
            L0073, lazarocardenas, 28.40927, -105.567217  
            L0074, lazarocardenas, 28.408825, -105.574157  
            L0075, lazarocardenas, 28.40855, -105.578379  
            L0076, lazarocardenas, 28.408865, -105.570221  
            L0077, lazarocardenas, 28.40869, -105.581475  
            L0078, lazarocardenas, 28.408775, -105.560825  
            L0079, lazarocardenas, 28.406445, -105.603526  
            L0080, lazarocardenas, 28.40694, -105.631541  
            L0081, lazarocardenas, 28.40469, -105.608596  
            L0082, lazarocardenas, 28.4064, -105.563715  
            L0083, lazarocardenas, 28.405365, -105.56753  
            L0084, lazarocardenas, 28.40595, -105.655667  
            L0085, lazarocardenas, 28.405905, -105.59295  
            L0086, lazarocardenas, 28.405185, -105.597923  
            L0087, lazarocardenas, 28.405455, -105.57054  
            L0088, lazarocardenas, 28.40541, -105.574045  
            L0089, lazarocardenas, 28.40388, -105.638254  
            L0090, lazarocardenas, 28.40397, -105.629767  
            L0091, lazarocardenas, 28.402585, -105.586627  
            L0092, lazarocardenas, 28.40195, -105.560538  
            L0093, lazarocardenas, 28.403115, -105.62048  
            L0094, lazarocardenas, 28.40294, -105.60098  
            L0095, lazarocardenas, 28.40218, -105.58254  
            L0096, lazarocardenas, 28.40146, -105.645875  
            L0097, lazarocardenas, 28.40249, -105.563722  
            L0098, lazarocardenas, 28.401055, -105.569016  
            L0099, lazarocardenas, 28.401235, -105.613947  
            L0100, lazarocardenas, 28.399885, -105.595937  
            L0101, lazarocardenas, 28.39993, -105.573977  
            L0102, lazarocardenas, 28.39795, -105.655396  
            L0103, lazarocardenas, 28.397365, -105.603555  
            L0104, lazarocardenas, 28.39647, -105.568142  
            L0105, lazarocardenas, 28.39634, -105.573201  
            L0106, lazarocardenas, 28.395395, -105.638587  
            L0107, lazarocardenas, 28.395845, -105.596815  
            L0108, lazarocardenas, 28.394405, -105.591025  
            L0109, lazarocardenas, 28.395665, -105.647012  
            L0110, lazarocardenas, 28.393955, -105.632385  
            L0111, lazarocardenas, 28.39391, -105.562688  
            L0112, lazarocardenas, 28.394315, -105.608135  
            L0113, lazarocardenas, 28.393685, -105.585313  
            L0114, lazarocardenas, 28.393775, -105.56834  
            L0115, lazarocardenas, 28.392785, -105.602962  
            L0116, lazarocardenas, 28.393055, -105.594148  
            L0117, lazarocardenas, 28.392155, -105.597355  
            L0118, lazarocardenas, 28.39072, -105.573392  
            L0119, lazarocardenas, 28.391175, -105.61501  
            L0120, lazarocardenas, 28.39104, -105.56852  
            L0121, lazarocardenas, 28.39113, -105.593405  
            L0122, lazarocardenas, 28.39158, -105.60779  
            L0123, lazarocardenas, 28.390545, -105.62974  
            L0124, lazarocardenas, 28.39014, -105.59987  
            L0125, lazarocardenas, 28.389915, -105.612225  
            L0126, lazarocardenas, 28.38942, -105.630415  
            L0127, lazarocardenas, 28.389285, -105.589056  
            L0128, lazarocardenas, 28.389015, -105.59084  
            L0129, lazarocardenas, 28.389375, -105.635325  
            L0130, lazarocardenas, 28.388295, -105.642045  
            L0131, lazarocardenas, 28.388205, -105.61586  
            L0132, lazarocardenas, 28.387755, -105.582535  
            L0133, lazarocardenas, 28.38753, -105.578603  
            L0134, lazarocardenas, 28.38677, -105.598502  
            L0135, lazarocardenas, 28.387575, -105.569558  
            L0136, lazarocardenas, 28.387175, -105.5647  
            L0137, lazarocardenas, 28.38686, -105.574421  
            L0138, lazarocardenas, 28.386635, -105.586248  
            L0139, lazarocardenas, 28.385695, -105.604115  
            L0140, lazarocardenas, 28.386185, -105.601527  
            L0141, lazarocardenas, 28.38565, -105.608038  
            L0142, lazarocardenas, 28.385155, -105.636683  
            L0143, lazarocardenas, 28.384705, -105.57382  
            L0144, lazarocardenas, 28.384615, -105.561675  
            L0145, lazarocardenas, 28.38331, -105.57038  
            L0146, lazarocardenas, 28.3825, -105.632075  
            L0147, lazarocardenas, 28.38232, -105.575102  
            L0148, lazarocardenas, 28.38138, -105.586106  
            L0149, lazarocardenas, 28.38178, -105.615001  
            L0150, lazarocardenas, 28.379945, -105.580645  
            L0151, lazarocardenas, 28.37972, -105.569984  
            L0152, lazarocardenas, 28.379045, -105.561453  
            L0153, lazarocardenas, 28.37891, -105.576851  
            L0154, lazarocardenas, 28.377965, -105.56268  
            L0155, lazarocardenas, 28.3781, -105.566905  
            L0156, lazarocardenas, 28.376705, -105.606461  
            L0157, lazarocardenas, 28.377605, -105.564151  
            L0158, lazarocardenas, 28.377065, -105.570472  
            L0159, lazarocardenas, 28.37671, -105.586314  
            L0160, lazarocardenas, 28.37505, -105.581907  
            L0161, lazarocardenas, 28.3759, -105.623053  
            L0162, lazarocardenas, 28.37577, -105.59969  
            L0163, lazarocardenas, 28.374915, -105.568183  
            L0164, lazarocardenas, 28.374735, -105.563996  
            L0165, lazarocardenas, 28.374775, -105.59538  
            L0166, lazarocardenas, 28.37307, -105.574941  
            L0167, lazarocardenas, 28.3737, -105.622081  
            L0168, lazarocardenas, 28.37262, -105.568858  
            L0169, lazarocardenas, 28.373025, -105.57834  
            L0170, lazarocardenas, 28.37253, -105.560915  
            L0171, lazarocardenas, 28.37172, -105.590019  
            L0172, lazarocardenas, 28.371675, -105.61691  
            L0173, lazarocardenas, 28.370015, -105.568845  
            L0174, lazarocardenas, 28.369615, -105.59008  
            L0175, lazarocardenas, 28.36939, -105.609237  
            L0176, lazarocardenas, 28.369075, -105.604005  
            L0177, lazarocardenas, 28.37006, -105.56447  
            L0178, lazarocardenas, 28.368085, -105.600005  
            L0179, lazarocardenas, 28.368715, -105.592959  
            L0180, lazarocardenas, 28.368445, -105.622218  
            L0181, lazarocardenas, 28.368355, -105.585008  
            L0182, lazarocardenas, 28.367725, -105.58891  
            L0183, lazarocardenas, 28.36858, -105.561394  
            L0184, lazarocardenas, 28.367725, -105.577505  
            L0185, lazarocardenas, 28.367905, -105.6058  
            L0186, lazarocardenas, 28.3675, -105.608871  
            L0187, lazarocardenas, 28.36723, -105.614555  
            L0188, lazarocardenas, 28.36723, -105.628419  
            L0189, lazarocardenas, 28.366015, -105.574961  
            L0190, lazarocardenas, 28.36557, -105.585068  
            L0191, lazarocardenas, 28.36557, -105.580043  
            L0192, lazarocardenas, 28.36566, -105.582558  
            L0193, lazarocardenas, 28.36566, -105.587677  
            L0194, lazarocardenas, 28.365655, -105.614155  
            L0195, lazarocardenas, 28.36557, -105.590215  
            L0196, lazarocardenas, 28.36593, -105.595321  
            L0197, lazarocardenas, 28.36548, -105.608602  
            L0198, lazarocardenas, 28.365525, -105.592798  
            L0199, lazarocardenas, 28.36539, -105.59794  
            L0200, lazarocardenas, 28.36499, -105.611235  
            L0201, lazarocardenas, 28.364945, -105.601125  
            L0202, lazarocardenas, 28.364765, -105.56864  
            L0203, lazarocardenas, 28.364405, -105.603105  
            L0204, lazarocardenas, 28.363865, -105.59749  
            L0205, lazarocardenas, 28.36391, -105.563626  
            L0206, lazarocardenas, 28.36328, -105.60809  
            L0207, lazarocardenas, 28.363505, -105.572515  
            L0208, lazarocardenas, 28.363415, -105.582622  
            L0209, lazarocardenas, 28.363595, -105.58509  
            L0210, lazarocardenas, 28.363505, -105.578732  
            L0211, lazarocardenas, 28.36337, -105.574849  
            L0212, lazarocardenas, 28.36337, -105.587385  
            L0213, lazarocardenas, 28.363145, -105.595155  
            L0214, lazarocardenas, 28.36292, -105.59284  
            L0215, lazarocardenas, 28.36328, -105.590728  
            L0216, lazarocardenas, 28.363145, -105.600432  
            L0217, lazarocardenas, 28.36283, -105.56042  
            L0218, lazarocardenas, 28.363055, -105.59857  
            L0219, lazarocardenas, 28.36211, -105.610358  
            L0220, lazarocardenas, 28.361525, -105.60499  
            L0221, lazarocardenas, 28.361345, -105.564678  
            L0222, lazarocardenas, 28.3613, -105.560375  
            L0223, lazarocardenas, 28.361075, -105.572492  
            L0224, lazarocardenas, 28.36094, -105.602925  
            L0225, lazarocardenas, 28.36076, -105.582445  
            L0226, lazarocardenas, 28.36112, -105.587587  
            L0227, lazarocardenas, 28.360715, -105.57873  
            L0228, lazarocardenas, 28.360625, -105.574907  
            L0229, lazarocardenas, 28.361255, -105.616215  
            L0230, lazarocardenas, 28.360985, -105.59309  
            L0231, lazarocardenas, 28.361075, -105.590238  
            L0232, lazarocardenas, 28.36085, -105.600477  
            L0233, lazarocardenas, 28.360805, -105.608071  
            L0234, lazarocardenas, 28.360805, -105.60589  
            L0235, lazarocardenas, 28.359995, -105.568843  
            L0236, lazarocardenas, 28.359995, -105.584355  
            L0237, lazarocardenas, 28.359905, -105.613412  
            L0238, lazarocardenas, 28.359105, -105.599915  
            L0239, lazarocardenas, 28.35906, -105.595245  
            L0240, lazarocardenas, 28.35888, -105.56033  
            L0241, lazarocardenas, 28.359105, -105.597895  
            L0242, lazarocardenas, 28.359145, -105.574834  
            L0243, lazarocardenas, 28.358565, -105.578693  
            L0244, lazarocardenas, 28.35888, -105.562143  
            L0245, lazarocardenas, 28.358925, -105.610605  
            L0246, lazarocardenas, 28.35883, -105.605485  
            L0247, lazarocardenas, 28.35879, -105.608045  
            L0248, lazarocardenas, 28.358835, -105.593135  
            L0249, lazarocardenas, 28.358295, -105.600765  
            L0250, lazarocardenas, 28.357755, -105.602396  
            L0251, lazarocardenas, 28.356585, -105.594795  
            L0252, lazarocardenas, 28.35636, -105.579892  
            L0253, lazarocardenas, 28.356585, -105.592753  
            L0254, lazarocardenas, 28.35672, -105.608058  
            L0255, lazarocardenas, 28.35681, -105.610605  
            L0256, lazarocardenas, 28.35654, -105.605485  
            L0257, lazarocardenas, 28.356495, -105.585675  
            L0258, lazarocardenas, 28.356495, -105.600342  
            L0259, lazarocardenas, 28.356495, -105.58195  
            L0260, lazarocardenas, 28.356585, -105.590345  
            L0261, lazarocardenas, 28.35645, -105.597895  
            L0262, lazarocardenas, 28.35542, -105.612785  
            L0263, lazarocardenas, 28.35663, -105.564633  
            L0264, lazarocardenas, 28.35573, -105.573772  
            L0265, lazarocardenas, 28.35439, -105.582575  
            L0266, lazarocardenas, 28.35479, -105.592145  
            L0267, lazarocardenas, 28.35421, -105.569775  
            L0268, lazarocardenas, 28.35434, -105.590193  
            L0269, lazarocardenas, 28.35421, -105.57879  
            L0270, lazarocardenas, 28.354475, -105.610605  
            L0271, lazarocardenas, 28.354205, -105.602925  
            L0272, lazarocardenas, 28.35434, -105.605509  
            L0273, lazarocardenas, 28.35452, -105.599707  
            L0274, lazarocardenas, 28.35385, -105.58761  
            L0275, lazarocardenas, 28.354165, -105.60809  
            L0276, lazarocardenas, 28.354345, -105.595051  
            L0277, lazarocardenas, 28.353805, -105.585765  
            L0278, lazarocardenas, 28.352185, -105.60854  
            L0279, lazarocardenas, 28.35187, -105.587632  
            L0280, lazarocardenas, 28.352095, -105.610425  
            L0281, lazarocardenas, 28.35178, -105.598862  
            L0282, lazarocardenas, 28.35205, -105.595223  
            L0283, lazarocardenas, 28.35187, -105.58502  
            L0284, lazarocardenas, 28.352095, -105.604  
            L0285, lazarocardenas, 28.35151, -105.578513  
            L0286, lazarocardenas, 28.3516, -105.56328  
            L0287, lazarocardenas, 28.351735, -105.60755  
            L0288, lazarocardenas, 28.351825, -105.583165  
            L0289, lazarocardenas, 28.35151, -105.571113  
            L0290, lazarocardenas, 28.351465, -105.592393  
            L0291, lazarocardenas, 28.350475, -105.610025  
            L0292, lazarocardenas, 28.350475, -105.585045  
            L0293, lazarocardenas, 28.350475, -105.58321  
            L0294, lazarocardenas, 28.350305, -105.605485  
            L0295, lazarocardenas, 28.35026, -105.60809  
            L0296, lazarocardenas, 28.350305, -105.599105  
            L0297, lazarocardenas, 28.350475, -105.595245  
            L0298, lazarocardenas, 28.350475, -105.590615  
            L0299, lazarocardenas, 28.350305, -105.602925  
    
    Version: This request was processed by AppEEARS version 3.137  

## 2. Request File Listing  

- Comma-separated values file with data extracted for a specific product
  - raiz-ecostress-lazaro-cardenas-ECO-L3T-JET-002-results.csv
- Text file with data pool URLs for all source granules used in the extraction
  - raiz-ecostress-lazaro-cardenas-granule-list.txt
- JSON request file which can be used in AppEEARS to create a new request
  - raiz-ecostress-lazaro-cardenas-request.json
- xml file
  - raiz-ecostress-lazaro-cardenas-ECO-L3T-JET-002-metadata.xml  

## 3. Point Sample Extraction Process  

Datasets available in AppEEARS are served via OPeNDAP (Open-source Project for a Network Data Access Protocol) services. OPeNDAP services allow users to concisely pull pixel values from datasets via HTTPS requests. A middleware layer has been developed to interact with the OPeNDAP services. The middleware makes it possible to extract scaled data values, with associated information, for pixels corresponding to a given coordinate and date range.

**NOTE:**  

- Requested date ranges may not match the reference date for multi-day products. AppEEARS takes an inclusive approach when extracting data for sample requests, often returning data that extends beyond the requested date range. This approach ensures that the returned data includes records for the entire requested date range.  
- For multi-day (8-day, 16-day, Monthly, Yearly) MODIS and Suomi NPP, NOAA-20, and NOAA-21 VIIRS datasets, the date field in the data tables reflects the first day of the composite period.  
- If selected, the SRTM v3, ASTER GDEM v3 and Global Water Bodies Database v1, and NASADEM v1 product will be extracted regardless of the time period specified in AppEEARS because it is a static dataset. The date field in the data tables reflects the nominal SRTM date of February 11, 2000.  
- If the visualizations indicate that there are no data to display, proceed to downloading the .csv output file. Data products that have both categorical and continuous data values (e.g. MOD15A2H) are not able to be displayed within the visualizations within AppEEARS.  

## 4. Data Quality  

When available, AppEEARS extracts and returns quality assurance (QA) data for each data file returned regardless of whether the user requests it. This is done to ensure that the user possesses the information needed to determine the usability and usefulness of the data they get from AppEEARS. Most data products available through AppEEARS have an associated QA data layer. Some products have more than one QA data layer to consult. See below for more information regarding data collections/products and their associated QA data layers.  

### 4.1. MODIS (Terra, Aqua, & Combined)

All MODIS land products, as well as the MODIS Snow Cover Daily product, include quality assurance (QA) information designed to help users understand and make best use of the data that comprise each product. Results downloaded from AppEEARS and/or data directly requested via middleware services contain not only the requested pixel/data values but also the decoded QA information associated with each pixel/data value extracted.  

- See the MODIS Land Products QA Tutorials: <https://lpdaac.usgs.gov/resources/e-learning/> for more QA information regarding each MODIS land product suite.  
- See the MODIS Snow Cover Daily product user guide for information regarding QA utilization and interpretation.  

### 4.2. NASA MEaSUREs SRTM v3 (30m & 90m)  

SRTM v3 products are accompanied by an ancillary "NUM" file in place of the QA/QC files. The "NUM" files indicate the source of each SRTM pixel, as well as the number of input data scenes used to generate the SRTM v3 data for that pixel.  

- See the user guide: <https://lpdaac.usgs.gov/documents/179/SRTM_User_Guide_V3.pdf> for additional information regarding the SRTM "NUM" file.  

### 4.3. NASA VIIRS (Suomi National Polar-orbiting Partnership (Suomi NPP) & NOAA-20)  

All NASA VIIRS land products include quality information designed to help users understand and make best use of the data that comprise each product. For product-specific information, see the link to the NASA VIIRS products table provided in section 5.  

**NOTE:**  

- The version 2 Suomi NPP NASA VIIRS Surface Reflectance data products VNP09A1 and VNP09H1 contain two quality layers: `SurfReflect_State` and `SurfReflect_QC`. 

### 4.4. SMAP  

SMAP products provide multiple means to assess quality. Each data product contains bit flags, uncertainty measures, and file-level metadata that provide quality information. Results downloaded from AppEEARS and/or data directly requested via middleware services contain not only the requested pixel/data values, but also the decoded bit flag information associated with each pixel/data value extracted. For additional information regarding the specific bit flags, uncertainty measures, and file-level metadata contained in this product, refer to the Quality Assessment section of the user guide for the specific SMAP data product in your request: <https://nsidc.org/data/smap/smap-data.html>  

### 4.5. Daymet v4R1

Daymet station-level daily weather observation data and the corresponding Daymet model predicted data for three Daymet model parameters: minimum temperature (tmin), maximum temperature (tmax), and daily total precipitation (prcp) are available. These data provide information into the regional accuracy of the Daymet model for the three station-level input parameters. Corresponding comma separated value (.csv) files that contain metadata for every surface weather station for the variable-year combinations are also available. <https://doi.org/10.3334/ORNLDAAC/2129>

### 4.6. ECOSTRESS

#### 4.6.1. ECOSTRESS Swath V2  

Quality information varies by product for the ECOSTRESS product suite. Quality Assurance (QA) information for ECO_L2_LSTE.002, including the bit definition index for the quality layer, is provided in section 2.4 of the User Guide: <https://lpdaac.usgs.gov/documents/1574/ECOL2_User_Guide_V2.pdf>. For Land Surface Temperature and Emissivity (LSTE) product, the quality flags of the source data are available in the ECO_L2_LSTE.002 data product. Please note that unlike V1, the V2 LSTE product does not incorporate cloud cover into the Pixel Produced QA bit flag. This flag now relates to other variables only (See Table 6 in User Guide). Users should apply the cloud mask separately to account for pixels with cloud when using ECO_L2_LSTE.002 data product. Cloud mask derived from ECO_L2_CLOUD.002 and Water mask derived from the Shuttle Radar Topography Mission (SRTM) Digital Elevation Model are available as separate science dataset (SDS) layers in the ECO_L2_LSTE.002 data product. Additionally, cloud and cloud confidence layers are available in the ECO_L2_CLOUD.002 product. Results downloaded from AppEEARS contain requested pixel/data values, decoded Quality Assurance (QA), and cloud information associated with each pixel/data value extracted.

#### 4.6.2. ECOSTRESS Tiled V2  

Quality information varies by product for the ECOSTRESS product suite. Quality information for ECO_L2T_LSTE.002, including the bit definition index for the quality layer, is provided in section 2.4 of the User Guide: <https://lpdaac.usgs.gov/documents/1574/ECOL2_User_Guide_V2.pdf>. Results downloaded from AppEEARS contain requested pixel/data values and decoded QA information associated with each pixel/data value extracted. For Land Surface Temperature and Emissivity (LSTE) product, the quality flags of the source data are available as a separate SDS layer in the ECO_L2T_LSTE.002 collection, however this Pixel Produced QA bit flags do not account for cloud cover. Users should apply the cloud mask separately to account for pixels with cloud when using ECO_L2T_LSTE.002 collection. In addition to decoded quality information, AppEEARS returns the cloud mask information for requests including layers from ECO_L2T_LSTE.002. For high-level products, Cloud mask derived from ECO_L2_CLOUD.002 and Water mask derived from the Shuttle Radar Topography Mission (SRTM) Digital Elevation Model are available as separate science dataset (SDS) layers in the ECO_L2T_LSTE.002 data product.

The ECOSTRESS Tiled Evapotranspiration disALEXI 24-Hour L3 CONUS 70 m V002 (ECO_L3T_ET_ALEXI) and ECOSTRESS Tiled Evaporative Stress Index disALEXI 24-Hour L4 CONUS 70 m V002 (ECO_L4T_ESI_ALEXI) products provide Evapotranspiration Daily Uncertainty and Evaporative Stress Index Daily Uncertainty bands.

### 4.7. ASTER GDEM v3 and Global Water Bodies Database v1  

ASTER GDEM v3 data are accompanied by an ancillary "NUM" file in place of the QA/QC files. The "NUM" files refer to the count of ASTER Level-1A scenes that were processed for each pixel or the source of reference data used to replace anomalies. The ASTER Global Water Bodies Database v1 products do not contain QA/QC files.  

- See Section 7 of the ASTER GDEM user guide: <https://lpdaac.usgs.gov/documents/434/ASTGTM_User_Guide_V3.pdf> for additional information regarding the GDEM "NUM" file.  
- See Section 7 of the ASTER Global Water Bodies Database user guide: <https://lpdaac.usgs.gov/documents/436/ASTWBD_User_Guide_V1.pdf> for a comparison with the SRTM Water Body Dataset.  

### 4.8. NASA MEaSUREs NASADEM v1 (30m)  

NASADEM v1 products are accompanied by an ancillary "NUM" file in place of the QA/QC files. The "NUM" files indicate the source of each NASADEM pixel, as well as the number of input data scenes used to generate the NASADEM v1 data for that pixel.  

- See the NASADEM user guide: <https://lpdaac.usgs.gov/documents/592/NASADEM_User_Guide_V1.pdf> for additional information regarding the NASADEM "NUM" file.  

### 4.9. HLS v2.0  

HLS v2.0 Operational Land Imager (OLI) Surface Reflectance and TOA Brightness Daily Global 30m (HLSL30 v002) and Sentinel-2 Multi-spectral Instrument (MSI) Surface Reflectance Daily Global 30m (HLSS30 v002) products have a quality assessment layer enabling per-pixel masking of cloud, cloud shadow, snow, water, and aerosol optical thickness levels. Quality information for HLSL30 v002 and HLSS30 v002 products, including bit definitions for the quality layer can be found in section 6.4 of the User Guide: <https://lpdaac.usgs.gov/documents/1326/HLS_User_Guide_V2.pdf>.  

### 4.10. Landsat Collection 2 ARD

Landsat C2 U.S. Analysis Ready Data (ARD) products are available for conterminous United States (CONUS)(1982-Present), Alaska (1984-present), and Hawaii (1989-1993, 1999-present). These data are products of Landsat 8/9 Operational Land Imager 2 (OLI-2) / Thermal Infrared Sensor 2 (TIRS-2), Landsat 7 Enhanced Thematic Mapper Plus (ETM+) and Landsat 4-5 Thematic Mapper (TM). The ARD significantly reduces the magnitude of data processing for application scientists. These data contain a quality assessment derived from Fmask version 3.3.1, Aerosol and Cloud QA derived from atmospheric compensation algorithms, and radiometric saturation QA derived from detector's input signal level. More details can be found in the Landsat Collection 2 U.S. ARD DFCB: <https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/media/files/LSDS-1435%20Landsat%20C2%20US%20ARD%20Data%20Format%20Control%20Book-v3.pdf>

### 4.11. US NPS Water Balance

The US NPS Historical Water Balance products do not have associated QA files or layers.

### 4.12. EMIT L1B Radiance and L2A Reflectance

The functionality of AppEEARS surrounding EMIT data is somewhat unique. There are currently no visualizations included within the AppEEARS UI, these will be added at a later date. Point requests return a comma-separated values (.csv) file organized in long format, rather than wide format to improve readability, resulting in some duplicate data for non-wavelength associated dimensions.  EMIT L1B At-Sensor Calibrated Radiance and Geolocation Data 60m (EMITL1BRAD) collection does not include quality information. EMIT L2A Estimated Surface Reflectance and Uncertainty and Masks 60m (EMITL2ARFL) collection does not have a direct quality assessment, but has a `good_wavelengths` flag associated with atmospheric water absorption features indicating where reflectance was not calculated. Additionally, the Reflectance Uncertainty product (EMIT_L2A_RFLUNCERT) contains uncertainty estimates about the reflectance captured as per-pixel, per-band posterior standard deviations, and the EMIT L2A Mask (EMIT_L2A_Mask) contains atmospheric state estimates and binary flags that can be used for quality filtering. By default the `good_wavelengths` layer is included with all requests that include the L2A Reflectance Product. More details about the EMIT_L2A_Mask can be found in the EMITL2ARFL User Guide: <https://lpdaac.usgs.gov/documents/1569/EMITL2ARFL_User_Guide_v1.pdf>

### 4.13. EMIT L2B Estimated Mineral Identification, Band Depth and Uncertainty

Similarly to the EMIT L1B Radiance and L2A Reflectance products, AppEEARS functionality for the EMIT L2B Mineralogy is also unique. The EMIT L2B Estimated Mineral Identification, Band Depth and Uncertainty 60m ([EMITL2BMIN](https://doi.org/10.5067/EMIT/EMITL2BMIN.001)) collection is generated using the [Tetracorder system](https://www.usgs.gov/publications/tetracorder-user-guide-version-44?_gl=1*1eoj33d*_ga*MTU3MTA3ODgxNS4xNjQ5MTg1MDgx*_ga_0YWDZEJ295*MTY4NjkyNTg0Mi40NC4xLjE2ODY5MjU4NzMuMC4wLjA.) ([code](https://github.com/PSI-edu/spectroscopy-tetracorder)). Point requests return a comma-separated values (.csv) file organized in long format, rather than wide format to improve readability, resulting in some duplicate data for non-group associated dimensions. These outputs also include quality data from the EMITL2BMINUNCERT product by default. This quality data includes the band depth uncertainty estimates and a fit score for the mineral identification. Band depth uncertainties are presented as standard deviations and the fit score is provided as the coefficient of determination (r^2) of the match between the continuum normalized library reference and the continuum normalized observed spectrum. There are currently no visualizations included within the AppEEARS UI, these will be added at a later date. More info can be found on the [EMITL2BMIN collection page](https://doi.org/10.5067/EMIT/EMITL2BMIN.001).

### 4.14. Plankton, Aerosol, Cloud, ocean Ecosystem (PACE) Ocean Color (OCI) Level-3 Global Mapped Data

PACE OCI Level-3 Global Mapped Surface Reflectance data do not have associated QA files or layers. Users should review the [documentation](https://www.earthdata.nasa.gov/data/catalog/ob-cloud-pace-oci-l3m-sfrefl-3.1#documents-and-resources) for more information on atmospheric correction and quality flags.

### 4.15 National Land Cover Database (NLCD)

NLCD data do not have associated QA files or layers. However, NLCD does provide a Land Cover Confidence layer as part of the product. For more information on how land cover confidence is measured, see the documentation (https://doi.org/10.5066/P1KWQF2G).

### 4.16. ECOSTRESS/OCO-3 Co-Located Data (ECOCO3)

ECOCO3 data do not have an associated QA layer. Please refer to the Data Disclaimer and Data Quality Issues sections in the product [README document](https://docserver.gesdisc.eosdis.nasa.gov/public/project/OCO/ECOSTRESS/ECOCO3_Readme_v002_20260903.pdf) for more details. 

## 5. Data Caveats  

### 5.1. ECOSTRESS

#### 5.1.1. ECOSTRESS Swath V2

- ECOSTRESS Swath data products are natively stored in swath format. To fulfill AppEEARS requests for ECOSTRESS Swath products, the data are first resampled from the native swath format to a georeferenced output. This requires the use of the requested ECOSTRESS product files and the corresponding ECO1BGEO: <https://doi.org/10.5067/ECOSTRESS/ECO1BGEO.001> files for all ECOSTRESS Swath products. To do this conversion, an index array and distance array are created, then the nearest area pixel is located. Next, the Euclidean distance to that area pixel plus all surrounding pixels is measured within a 210 meter search radius (+/- a 3 pixels). This results in 49 pixels measured for every swath pixel. If the distance measured is less than what's currently present in any distance array, then the new distance as well as the swath index value are recorded into the index array used to convert to an area output.

#### 5.1.2. ECOSTRESS Tiled V2

- It is not uncommon for many .csv cells returned to contain NaN values. If any layer requested or the QC layer contains valid data, the remaining requested layers will be returned even if only NaN values are present.

### 5.2. NASA VIIRS SNPP, NOAA-20, and NOAA-21

- Several products from these instruments have multiple fill values that describe categorical information (i.e. water/ocean) about why the pixel was not processed in the source data. If one of these additional fill-values is returned as part of a point request it is returned without the scale factor applied to enable users to easily identify and decode the value. The fill values will be outside the indicated valid range. Products where this is the case include:
    - VNP13, VJ113, and VJ213 Vegetation Indices Products
    - VNP15, VJ115, and VJ215 Leaf Area Index/FPAR Products
    - VNP17, VJ117, and VJ217 Gross Primary Productivity and Photosynthesis Products
    - VNP22, VJ122, and VJ222 Land Surface Phenology Products

#### 5.2.1. Suomi NPP VIIRS Land Surface Phenology Product (VNP22Q2)

- A subset of the science datasets/variables for VNP22Q2 are returned in their raw, unscaled form. That is, these variables are returned without having their scale factor and offset applied. AppEEARS visualizations and output summary files are derived using the raw data value, and consequently do not characterize the intended information ("day of year") for the impacted variables. The variables returned in this state include:  

    1. Date_Mid_Greenup_Phase (Cycle 1 and Cycle 2)  
    2. Date_Mid_Senescence_Phase (Cycle 1 and Cycle 2)  
    3. Onset_Greenness_Increase (Cycle 1 and Cycle 2)  
    4. Onset_Greenness_Decrease (Cycle 1 and Cycle 2)  
    5. Onset_Greenness_Maximum (Cycle 1 and Cycle 2)  
    6. Onset_Greenness_Minimum (Cycle 1 and Cycle 2)  

- To convert the raw data to "day of year" (doy) for the above variables, use the following equation:  

      doy = Raw_Data_Value * 1 – (Given_Year - 2000) * 366

### 5.3. SMAP

#### 5.3.1. SMAP Enhanced L3 Radiometer Global and Polar Grid Daily 9 km EASE-Grid Soil Moisture (SPL3SMP_E)

- The SPL3SMP_E includes additional layers for AM and PM north-polar grid soil moisture retrievals. These additional layers are not supported in AppEEARS.

#### 5.3.2. SMAP L4 Global 3-hourly 9 km EASE-Grid Surface and Root Zone Soil Moisture Geophysical Data (SPL4SMGP)

- The SPL4SMGP provides 3-hourly data within a single day. AppEEARS specifies the observation date and time in the output CSV file.

### 5.4. HLS v2.0

- When requesting HLS timeseries, note that Sentinel-2 launched after Landsat was already active. Landsat OLI (HLSL30 v002) products are available from 2013-04-11 to present, while Sentinel-2 MSI products (HLSS30 v002) are available from  2015-11-30 to present.
- Point requests are returned in geographic coordinates.  
- Extra granules may appear in the granule list output file if the target point is close to an area where MGRS tiles overlap.
- Historical processing of the HLS Vegetation Indices (VI) products (HLSS30_VI v002 and HLSL30_VI v002) has not started as of May 9, 2025. Data currently available in AppEEARS is from February 6, 2025 to present. 

### 5.5. MOD44B V6.1

- Value zero in the Cloud and Quality layers from MOD44B Version 6.1 Vegetation Continuous Fields (VCF) yearly product is assigned to Fill Value in the source file while value zero is meaningful for those layers. If comparing Cloud and Quality layers outputs with source files, users may notice that within the source files zero is assigned to fill value, however zero is within the valid range. Thus, AppEEARS outputs use -999 as a fill value for those layers.

### 5.6. EMIT L1B Radiance and L2A Reflectance

- Elevation data is always included in requests. For API users there is an additional 'elev' layer listed, but that layer cannot be requested. This has to be present due to some constraints of AppEEARS' backend.
- For L1B Radiance and L2A reflectance products, the default included quality layer is 'good bands' which denotes where radiance/reflectance data were not estimated due to atmospheric water absorption features. This is included with all requests.
- The EMIT mission is focused on collecting data from land arid dust source regions, meaning that coverage is limited to those regions based upon a mask. You can explore coverage and forecasted coverage using Jet Propulsion Laboratory's [Visions: EMIT Open Data Portal](https://earth.jpl.nasa.gov/emit/data/data-portal/coverage-and-forecasts/)

### 5.7. EMIT L2B Estimated Mineral Identification, Band Depth and Uncertainty

- The EMIT_L2B_MIN product is generated to support the EMIT mission objectives of constraining the sign of dust-related radiative forcing. Ten mineral types are the core focus of this work: Calcite, Chlorite, Dolomite, Goethite, Gypsum, Hematite, Illite+Muscovite, Kaolinite, Montmorillonite, and Vermiculite. Additional minerals are included in this product for transparency but were not the focus of this product. Further validation is required to use these additional mineral maps, particularly in the case of resource exploration. Similarly, the separation of minerals with similar spectral features, such as a fine-grained goethite and hematite, is an active research area. The results presented here are an initial offering, but the precise categorization is likely to evolve, and the limits of what can and cannot be separated on a global scale are still being explored. The user is encouraged to read the Algorithm Theoretical Basis Document ([ATBD](https://lpdaac.usgs.gov/documents/1659/EMITL2B_ATBD_v1.pdf)) for more details.  
- "no_match" was added to the mineral library constituents for cases where no match was found via the tetracorder system (this has a value of 0 in the original data, but there is not an entry with an index of 0 in the "mineral_metadata" group).
- Elevation data is always included in requests. For API users there is an additional 'elev' layer listed, but that layer cannot be requested. This has to be present due to some constraints of AppEEARS' backend.

### 5.8. PACE OCI  Level-3 Global Mapped Data

- PACE OCI  Level-3 Global Mapped Data provide global coverage at three spatial resolutions — 0.1 degree, 2 km, and 4 km — and two temporal compositing intervals: daily and 8-day. To streamline data access and eliminate the need to filter by resolution or temporal period within a single collection, each collection has been integrated into AppEEARS as six separate products, one per resolution and temporal combination. Users are advised to select the collection that corresponds to their required spatial resolution and temporal compositing interval prior to submitting a request.

Collection names follow the convention PACE_OCI_L3M_SFREFL_[RESOLUTION]_[TEMPORAL], where resolution is denoted as 0p1deg, 2KM, or 4KM, and temporal interval as DAY or 8D.

### 5.9. ECOSTRESS/OCO-3 Co-Located Data (ECOCO3)

- ECOCO3 source data includes multiple groups. AppEEARS outputs include all the variables under the `Science` group and exclude the `GridCoverage`, `Geolocation`, and `GridDenominators` groups. 
- For Land Cover Type and Fraction from MODIS and VIIRS, the layers are selectable in AppEEARS, but the results include four separate files for each layer selection. For Land Cover Type Classes for both VIIRS and MODIS, the classes follow the same approach as MCD12Q1 (Table 3 in the [MCD12 User Guide](https://lpdaac.usgs.gov/documents/1409/MCD12_User_Guide_V61.pdf)). When a pixel contains only one Land Cover Type, or fewer than four within a single pixel, AppEEARS returns a fill value of -127 for the remaining Land Cover Type and Fraction layers. 
- There is no visualization available for Land Cover Fraction variable. 

## 6. Documentation  

Documentation for data products available through AppEEARS are listed below.  

### 6.1. MODIS Land Products (Terra, Aqua, & Combined)  

- <https://lpdaac.usgs.gov/product_search/?collections=Combined+MODIS&collections=Terra+MODIS&collections=Aqua+MODIS&view=list>  

### 6.2. MODIS Snow Products (Terra and Aqua)  

- <https://nsidc.org/data/modis/data_summaries>  

### 6.3. NASA MEaSUREs SRTM v3  

- <https://doi.org/10.5067/MEASURES/SRTM/SRTMGL1.003>  
- <https://doi.org/10.5067/MEASURES/SRTM/SRTMGL1N.003>  
- <https://doi.org/10.5067/MEaSUREs/SRTM/SRTMGL3.003>  
- <https://doi.org/10.5067/MEASURES/SRTM/SRTMGL3N.003>  

### 6.4. NASA VIIRS Land Products (Includes Suomi NPP, NOAA-20, and NOAA-21)  

- <https://www.earthdata.nasa.gov/data/catalog?keyword=VIIRS%20LP%20DAAC>  

### 6.5. SMAP Products  

- <http://nsidc.org/data/smap/smap-data.html>  

### 6.6. Daymet v4R1

- <https://doi.org/10.3334/ORNLDAAC/2129>
- <https://daymet.ornl.gov/>

### 6.7. ECOSTRESS  

- <https://www.earthdata.nasa.gov/data/catalog?keyword=ECOSTRESS&page_num=4>  

### 6.8. ASTER GDEM v3 and Global Water Bodies Database v1  

- <https://doi.org/10.5067/ASTER/ASTGTM.003>  
- <https://doi.org/10.5067/ASTER/ASTWBD.001>  

### 6.9. NASADEM  

- <https://doi.org/10.5067/MEaSUREs/NASADEM/NASADEM_NC.001>  
- <https://doi.org/10.5067/MEaSUREs/NASADEM/NASADEM_NUMNC.001> 

### 6.10. HLS v2.0  
 
- <https://doi.org/10.5067/HLS/HLSL30.002>  
- <https://doi.org/10.5067/HLS/HLSS30.002>  

### 6.11. Landsat ARD

- <https://doi.org/10.5066/P960F8OC>

### 6.12. EMIT L1B Radiance and L2A Reflectance

- <https://doi.org/10.5067/EMIT/EMITL1BRAD.001>
- <https://doi.org/10.5067/EMIT/EMITL2ARFL.001>

### 6.13. EMIT L2B Estimated Mineral Identification, Band Depth and Uncertainty

- <https://doi.org/10.5067/EMIT/EMITL2BMIN.001>

### 6.14.  NASA VIIRS Snow Products (Includes Suomi NPP, NOAA-20, and NOAA-21)

- <https://doi.org/10.5067/45VDCKJBXWEE>

### 6.15. PACE OCI Level-3 Global Mapped Surface Reflectance Data

- <https://doi.org/10.5067/PACE/OCI/L3M/SFREFL/3.1>

### 6.16. National Land Cover Database (NLCD)

- <https://www.mrlc.gov/sites/default/files/docs/LSDS-2103%20Annual%20National%20Land%20Cover%20Database%20(NLCD)%20Collection%201%20Science%20Product%20User%20Guide%20-v1.2%202026_04_21.pdf>

### 6.17. ECOSTRESS/OCO-3 Co-Located Data (ECOCO3)

- <https://docserver.gesdisc.eosdis.nasa.gov/public/project/OCO/ECOSTRESS/ECOCO3_Readme_v002_20260903.pdf>
- <https://docserver.gesdisc.eosdis.nasa.gov/public/project/OCO/ECOSTRESS/ECOCO3_Sequence_Locations_v002_20260903.pdf>

## 7. Sample Request Retention  

AppEEARS sample request outputs are available to download for a limited amount of time after completion. Please visit <https://appeears.earthdatacloud.nasa.gov/help?section=sample-retention> for details.  

## 8. Data Product Citations  

- Hook, S., & Halverson, G. (2024). ECOSTRESS Tiled Evapotranspiration Instantaneous and Daytime L3 Global 70 m v002. NASA Land Processes Distributed Active Archive Center. https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002. Accessed November 15, 2026.

## 9. Software Citation  

AppEEARS Team. (2026). Application for Extracting and Exploring Analysis Ready Samples (AppEEARS). Ver. 3.137. NASA EOSDIS Land Processes Distributed Active Archive Center (LP DAAC), USGS/Earth Resources Observation and Science (EROS) Center, Sioux Falls, South Dakota, USA. Accessed November 15, 2026. https://appeears.earthdatacloud.nasa.gov

## 10. Feedback  

We value your opinion. Please help us identify what works, what doesn't, and anything we can do to make AppEEARS better by submitting your feedback at <https://appeears.earthdatacloud.nasa.gov/feedback> or to LP DAAC User Services at <https://lpdaac.usgs.gov/lpdaac-contact-us/>.
