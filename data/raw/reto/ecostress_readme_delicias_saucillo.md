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

    Name: raiz_ecostress_delicias_saucillo  

    Date Completed: 2026-11-15T02:56:57.768010  

    ID: 8d53d4fe-9e3f-48ee-8947-84078f3f8c99  

    Details:  

        Start Date: 10-01-2025  

        End Date: 09-30-2026
    
        Layers:  

            ETdaily (ECO_L3T_JET.002)  
            ETinstUncertainty (ECO_L3T_JET.002)  
            cloud (ECO_L3T_JET.002)  
            water (ECO_L3T_JET.002)  
    
        Coordinates:  

            P0001, deliciassaucillo, 28.189675, -105.526745  
            P0002, deliciassaucillo, 28.189325, -105.509055  
            P0003, deliciassaucillo, 28.18937, -105.524725  
            P0004, deliciassaucillo, 28.189415, -105.559085  
            P0005, deliciassaucillo, 28.189415, -105.49508  
            P0006, deliciassaucillo, 28.189505, -105.505455  
            P0007, deliciassaucillo, 28.18928, -105.49293  
            P0008, deliciassaucillo, 28.189055, -105.332545  
            P0009, deliciassaucillo, 28.18901, -105.531555  
            P0010, deliciassaucillo, 28.18883, -105.515205  
            P0011, deliciassaucillo, 28.188605, -105.496745  
            P0012, deliciassaucillo, 28.188605, -105.348637  
            P0013, deliciassaucillo, 28.188695, -105.384505  
            P0014, deliciassaucillo, 28.188425, -105.429415  
            P0015, deliciassaucillo, 28.18847, -105.42057  
            P0016, deliciassaucillo, 28.188425, -105.339135  
            P0017, deliciassaucillo, 28.18856, -105.402867  
            P0018, deliciassaucillo, 28.188425, -105.53443  
            P0019, deliciassaucillo, 28.188245, -105.559475  
            P0020, deliciassaucillo, 28.18748, -105.363663  
            P0021, deliciassaucillo, 28.188335, -105.33379  
            P0022, deliciassaucillo, 28.18802, -105.43265  
            P0023, deliciassaucillo, 28.187885, -105.520485  
            P0024, deliciassaucillo, 28.187435, -105.503932  
            P0025, deliciassaucillo, 28.18784, -105.52486  
            P0026, deliciassaucillo, 28.18739, -105.539342  
            P0027, deliciassaucillo, 28.187255, -105.394258  
            P0028, deliciassaucillo, 28.18757, -105.530126  
            P0029, deliciassaucillo, 28.18757, -105.5099  
            P0030, deliciassaucillo, 28.187615, -105.49607  
            P0031, deliciassaucillo, 28.186535, -105.389075  
            P0032, deliciassaucillo, 28.186805, -105.374472  
            P0033, deliciassaucillo, 28.18748, -105.52248  
            P0034, deliciassaucillo, 28.187255, -105.53326  
            P0035, deliciassaucillo, 28.187615, -105.352286  
            P0036, deliciassaucillo, 28.187435, -105.343921  
            P0037, deliciassaucillo, 28.186895, -105.32957  
            P0038, deliciassaucillo, 28.18667, -105.507567  
            P0039, deliciassaucillo, 28.186625, -105.53236  
            P0040, deliciassaucillo, 28.18631, -105.41455  
            P0041, deliciassaucillo, 28.185815, -105.535015  
            P0042, deliciassaucillo, 28.186355, -105.334375  
            P0043, deliciassaucillo, 28.186175, -105.541255  
            P0044, deliciassaucillo, 28.185995, -105.338505  
            P0045, deliciassaucillo, 28.185635, -105.497915  
            P0046, deliciassaucillo, 28.185635, -105.502805  
            P0047, deliciassaucillo, 28.18559, -105.512858  
            P0048, deliciassaucillo, 28.18483, -105.40763  
            P0049, deliciassaucillo, 28.18532, -105.537319  
            P0050, deliciassaucillo, 28.185005, -105.495358  
            P0051, deliciassaucillo, 28.184695, -105.419662  
            P0052, deliciassaucillo, 28.184695, -105.509357  
            P0053, deliciassaucillo, 28.18443, -105.522579  
            P0054, deliciassaucillo, 28.183795, -105.385416  
            P0055, deliciassaucillo, 28.18434, -105.50047  
            P0056, deliciassaucillo, 28.18447, -105.323333  
            P0057, deliciassaucillo, 28.184565, -105.525309  
            P0058, deliciassaucillo, 28.184205, -105.5311  
            P0059, deliciassaucillo, 28.183935, -105.379617  
            P0060, deliciassaucillo, 28.1838, -105.505847  
            P0061, deliciassaucillo, 28.18344, -105.383026  
            P0062, deliciassaucillo, 28.1838, -105.513199  
            P0063, deliciassaucillo, 28.183845, -105.49827  
            P0064, deliciassaucillo, 28.183395, -105.503615  
            P0065, deliciassaucillo, 28.18326, -105.540495  
            P0066, deliciassaucillo, 28.183395, -105.331809  
            P0067, deliciassaucillo, 28.183755, -105.366845  
            P0068, deliciassaucillo, 28.18281, -105.543039  
            P0069, deliciassaucillo, 28.183035, -105.360155  
            P0070, deliciassaucillo, 28.18227, -105.348475  
            P0071, deliciassaucillo, 28.182585, -105.389534  
            P0072, deliciassaucillo, 28.182315, -105.55581  
            P0073, deliciassaucillo, 28.18182, -105.534025  
            P0074, deliciassaucillo, 28.18128, -105.528548  
            P0075, deliciassaucillo, 28.18137, -105.539953  
            P0076, deliciassaucillo, 28.182315, -105.374611  
            P0077, deliciassaucillo, 28.181325, -105.559085  
            P0078, deliciassaucillo, 28.1811, -105.360155  
            P0079, deliciassaucillo, 28.180785, -105.331531  
            P0080, deliciassaucillo, 28.18074, -105.358045  
            P0081, deliciassaucillo, 28.18092, -105.498406  
            P0082, deliciassaucillo, 28.1798, -105.421402  
            P0083, deliciassaucillo, 28.180605, -105.495845  
            P0084, deliciassaucillo, 28.180785, -105.536573  
            P0085, deliciassaucillo, 28.180065, -105.419021  
            P0086, deliciassaucillo, 28.18002, -105.511558  
            P0087, deliciassaucillo, 28.18101, -105.384568  
            P0088, deliciassaucillo, 28.17993, -105.50303  
            P0089, deliciassaucillo, 28.180245, -105.546105  
            P0090, deliciassaucillo, 28.180155, -105.55961  
            P0091, deliciassaucillo, 28.179885, -105.52971  
            P0092, deliciassaucillo, 28.179885, -105.414134  
            P0093, deliciassaucillo, 28.179525, -105.44891  
            P0094, deliciassaucillo, 28.179615, -105.34098  
            P0095, deliciassaucillo, 28.17989, -105.506616  
            P0096, deliciassaucillo, 28.178855, -105.44105  
            P0097, deliciassaucillo, 28.178855, -105.544035  
            P0098, deliciassaucillo, 28.17903, -105.555855  
            P0099, deliciassaucillo, 28.178985, -105.335101  
            P0100, deliciassaucillo, 28.178815, -105.54166  
            P0101, deliciassaucillo, 28.17854, -105.502985  
            P0102, deliciassaucillo, 28.179255, -105.494804  
            P0103, deliciassaucillo, 28.177105, -105.406904  
            P0104, deliciassaucillo, 28.178675, -105.435475  
            P0105, deliciassaucillo, 28.1785, -105.539415  
            P0106, deliciassaucillo, 28.17845, -105.49829  
            P0107, deliciassaucillo, 28.17818, -105.50065  
            P0108, deliciassaucillo, 28.177915, -105.32903  
            P0109, deliciassaucillo, 28.177555, -105.511264  
            P0110, deliciassaucillo, 28.17769, -105.38648  
            P0111, deliciassaucillo, 28.177375, -105.557425  
            P0112, deliciassaucillo, 28.177375, -105.42506  
            P0113, deliciassaucillo, 28.177195, -105.428211  
            P0114, deliciassaucillo, 28.177105, -105.502585  
            P0115, deliciassaucillo, 28.177015, -105.54422  
            P0116, deliciassaucillo, 28.176745, -105.347085  
            P0117, deliciassaucillo, 28.17688, -105.3328  
            P0118, deliciassaucillo, 28.176745, -105.549655  
            P0119, deliciassaucillo, 28.176925, -105.357618  
            P0120, deliciassaucillo, 28.176565, -105.542101  
            P0121, deliciassaucillo, 28.17679, -105.381516  
            P0122, deliciassaucillo, 28.17678, -105.349599  
            P0123, deliciassaucillo, 28.176385, -105.338631  
            P0124, deliciassaucillo, 28.176655, -105.390282  
            P0125, deliciassaucillo, 28.17625, -105.37134  
            P0126, deliciassaucillo, 28.17454, -105.413821  
            P0127, deliciassaucillo, 28.175395, -105.43696  
            P0128, deliciassaucillo, 28.17508, -105.51269  
            P0129, deliciassaucillo, 28.175395, -105.53717  
            P0130, deliciassaucillo, 28.17454, -105.513815  
            P0131, deliciassaucillo, 28.174405, -105.381152  
            P0132, deliciassaucillo, 28.17445, -105.369208  
            P0133, deliciassaucillo, 28.174405, -105.553515  
            P0134, deliciassaucillo, 28.174495, -105.551635  
            P0135, deliciassaucillo, 28.176565, -105.352508  
            P0136, deliciassaucillo, 28.173965, -105.54835  
            P0137, deliciassaucillo, 28.17414, -105.333031  
            P0138, deliciassaucillo, 28.172345, -105.500984  
            P0139, deliciassaucillo, 28.17365, -105.506085  
            P0140, deliciassaucillo, 28.173335, -105.330825  
            P0141, deliciassaucillo, 28.173065, -105.343603  
            P0142, deliciassaucillo, 28.172525, -105.357583  
            P0143, deliciassaucillo, 28.172885, -105.553785  
            P0144, deliciassaucillo, 28.1732, -105.32063  
            P0145, deliciassaucillo, 28.17396, -105.49571  
            P0146, deliciassaucillo, 28.172525, -105.3359  
            P0147, deliciassaucillo, 28.17221, -105.435654  
            P0148, deliciassaucillo, 28.17212, -105.535285  
            P0149, deliciassaucillo, 28.172705, -105.503278  
            P0150, deliciassaucillo, 28.1714, -105.431893  
            P0151, deliciassaucillo, 28.171445, -105.55356  
            P0152, deliciassaucillo, 28.17176, -105.405776  
            P0153, deliciassaucillo, 28.17158, -105.365665  
            P0154, deliciassaucillo, 28.171085, -105.334029  
            P0155, deliciassaucillo, 28.171085, -105.381367  
            P0156, deliciassaucillo, 28.17104, -105.42578  
            P0157, deliciassaucillo, 28.170725, -105.42028  
            P0158, deliciassaucillo, 28.17095, -105.54918  
            P0159, deliciassaucillo, 28.171445, -105.413914  
            P0160, deliciassaucillo, 28.17077, -105.37107  
            P0161, deliciassaucillo, 28.170815, -105.443408  
            P0162, deliciassaucillo, 28.17041, -105.513991  
            P0163, deliciassaucillo, 28.170185, -105.354018  
            P0164, deliciassaucillo, 28.170995, -105.393533  
            P0165, deliciassaucillo, 28.16987, -105.438754  
            P0166, deliciassaucillo, 28.170635, -105.546493  
            P0167, deliciassaucillo, 28.170005, -105.347535  
            P0168, deliciassaucillo, 28.170275, -105.434578  
            P0169, deliciassaucillo, 28.169825, -105.44855  
            P0170, deliciassaucillo, 28.169825, -105.55283  
            P0171, deliciassaucillo, 28.169825, -105.358509  
            P0172, deliciassaucillo, 28.169915, -105.52922  
            P0173, deliciassaucillo, 28.169465, -105.335798  
            P0174, deliciassaucillo, 28.169285, -105.556305  
            P0175, deliciassaucillo, 28.169015, -105.5488  
            P0176, deliciassaucillo, 28.16933, -105.534538  
            P0177, deliciassaucillo, 28.168885, -105.498968  
            P0178, deliciassaucillo, 28.1683, -105.508868  
            P0179, deliciassaucillo, 28.168705, -105.502314  
            P0180, deliciassaucillo, 28.168745, -105.558596  
            P0181, deliciassaucillo, 28.168655, -105.542901  
            P0182, deliciassaucillo, 28.169015, -105.430436  
            P0183, deliciassaucillo, 28.16878, -105.531089  
            P0184, deliciassaucillo, 28.168035, -105.35993  
            P0185, deliciassaucillo, 28.167855, -105.35692  
            P0186, deliciassaucillo, 28.16781, -105.436555  
            P0187, deliciassaucillo, 28.167585, -105.54678  
            P0188, deliciassaucillo, 28.167585, -105.343001  
            P0189, deliciassaucillo, 28.167855, -105.373495  
            P0190, deliciassaucillo, 28.167135, -105.337515  
            P0191, deliciassaucillo, 28.166865, -105.55251  
            P0192, deliciassaucillo, 28.167315, -105.548845  
            P0193, deliciassaucillo, 28.167, -105.550735  
            P0194, deliciassaucillo, 28.166685, -105.353164  
            P0195, deliciassaucillo, 28.166595, -105.384073  
            P0196, deliciassaucillo, 28.16628, -105.426295  
            P0197, deliciassaucillo, 28.166415, -105.412649  
            P0198, deliciassaucillo, 28.166235, -105.5338  
            P0199, deliciassaucillo, 28.16628, -105.34021  
            P0200, deliciassaucillo, 28.166325, -105.404989  
            P0201, deliciassaucillo, 28.16583, -105.556539  
            P0202, deliciassaucillo, 28.16502, -105.503255  
            P0203, deliciassaucillo, 28.165605, -105.358784  
            P0204, deliciassaucillo, 28.16601, -105.324019  
            P0205, deliciassaucillo, 28.166145, -105.364983  
            P0206, deliciassaucillo, 28.166325, -105.515149  
            P0207, deliciassaucillo, 28.16637, -105.34807  
            P0208, deliciassaucillo, 28.1648, -105.362798  
            P0209, deliciassaucillo, 28.16547, -105.3783  
            P0210, deliciassaucillo, 28.165065, -105.435226  
            P0211, deliciassaucillo, 28.16547, -105.50119  
            P0212, deliciassaucillo, 28.16511, -105.55898  
            P0213, deliciassaucillo, 28.165245, -105.499035  
            P0214, deliciassaucillo, 28.165335, -105.431192  
            P0215, deliciassaucillo, 28.16421, -105.522466  
            P0216, deliciassaucillo, 28.164165, -105.554055  
            P0217, deliciassaucillo, 28.164165, -105.420083  
            P0218, deliciassaucillo, 28.164075, -105.441185  
            P0219, deliciassaucillo, 28.16412, -105.55168  
            P0220, deliciassaucillo, 28.163405, -105.365095  
            P0221, deliciassaucillo, 28.163715, -105.53335  
            P0222, deliciassaucillo, 28.163495, -105.498585  
            P0223, deliciassaucillo, 28.16345, -105.55765  
            P0224, deliciassaucillo, 28.163365, -105.445495  
            P0225, deliciassaucillo, 28.16376, -105.490323  
            P0226, deliciassaucillo, 28.163135, -105.516264  
            P0227, deliciassaucillo, 28.16296, -105.559295  
            P0228, deliciassaucillo, 28.162865, -105.520903  
            P0229, deliciassaucillo, 28.16233, -105.505894  
            P0230, deliciassaucillo, 28.161925, -105.527888  
            P0231, deliciassaucillo, 28.162285, -105.55419  
            P0232, deliciassaucillo, 28.161925, -105.546799  
            P0233, deliciassaucillo, 28.162015, -105.353102  
            P0234, deliciassaucillo, 28.161835, -105.443093  
            P0235, deliciassaucillo, 28.162015, -105.357558  
            P0236, deliciassaucillo, 28.16192, -105.425285  
            P0237, deliciassaucillo, 28.16188, -105.55199  
            P0238, deliciassaucillo, 28.16206, -105.511728  
            P0239, deliciassaucillo, 28.161925, -105.557069  
            P0240, deliciassaucillo, 28.161205, -105.446327  
            P0241, deliciassaucillo, 28.160665, -105.55958  
            P0242, deliciassaucillo, 28.161025, -105.538065  
            P0243, deliciassaucillo, 28.16188, -105.412058  
            P0244, deliciassaucillo, 28.160665, -105.540681  
            P0245, deliciassaucillo, 28.160485, -105.515416  
            P0246, deliciassaucillo, 28.160575, -105.438198  
            P0247, deliciassaucillo, 28.160665, -105.376955  
            P0248, deliciassaucillo, 28.160395, -105.508245  
            P0249, deliciassaucillo, 28.159495, -105.430248  
            P0250, deliciassaucillo, 28.160125, -105.53645  
            P0251, deliciassaucillo, 28.1599, -105.5541  
            P0252, deliciassaucillo, 28.159405, -105.527507  
            P0253, deliciassaucillo, 28.159945, -105.335085  
            P0254, deliciassaucillo, 28.15954, -105.497307  
            P0255, deliciassaucillo, 28.159135, -105.555675  
            P0256, deliciassaucillo, 28.159, -105.538875  
            P0257, deliciassaucillo, 28.159765, -105.399621  
            P0258, deliciassaucillo, 28.158775, -105.537345  
            P0259, deliciassaucillo, 28.158505, -105.47644  
            P0260, deliciassaucillo, 28.15891, -105.451124  
            P0261, deliciassaucillo, 28.15855, -105.364438  
            P0262, deliciassaucillo, 28.158505, -105.51618  
            P0263, deliciassaucillo, 28.159045, -105.533649  
            P0264, deliciassaucillo, 28.157655, -105.495534  
            P0265, deliciassaucillo, 28.157525, -105.355571  
            P0266, deliciassaucillo, 28.15815, -105.500628  
            P0267, deliciassaucillo, 28.158235, -105.554235  
            P0268, deliciassaucillo, 28.15819, -105.493095  
            P0269, deliciassaucillo, 28.157835, -105.520737  
            P0270, deliciassaucillo, 28.157695, -105.54988  
            P0271, deliciassaucillo, 28.157835, -105.504042  
            P0272, deliciassaucillo, 28.157435, -105.347184  
            P0273, deliciassaucillo, 28.15779, -105.552019  
            P0274, deliciassaucillo, 28.156575, -105.42636  
            P0275, deliciassaucillo, 28.157835, -105.420223  
            P0276, deliciassaucillo, 28.15734, -105.545475  
            P0277, deliciassaucillo, 28.157525, -105.54808  
            P0278, deliciassaucillo, 28.157255, -105.513095  
            P0279, deliciassaucillo, 28.15667, -105.55871  
            P0280, deliciassaucillo, 28.15667, -105.55599  
            P0281, deliciassaucillo, 28.15689, -105.542713  
            P0282, deliciassaucillo, 28.157385, -105.443081  
            P0283, deliciassaucillo, 28.15685, -105.52967  
            P0284, deliciassaucillo, 28.15676, -105.445495  
            P0285, deliciassaucillo, 28.15658, -105.55446  
            P0286, deliciassaucillo, 28.155995, -105.35688  
            P0287, deliciassaucillo, 28.15622, -105.412775  
            P0288, deliciassaucillo, 28.156355, -105.44873  
            P0289, deliciassaucillo, 28.1564, -105.47298  
            P0290, deliciassaucillo, 28.156535, -105.363985  
            P0291, deliciassaucillo, 28.156085, -105.476845  
            P0292, deliciassaucillo, 28.156445, -105.40489  
            P0293, deliciassaucillo, 28.155815, -105.393975  
            P0294, deliciassaucillo, 28.155905, -105.507112  
            P0295, deliciassaucillo, 28.155635, -105.494275  
            P0296, deliciassaucillo, 28.155455, -105.523389  
            P0297, deliciassaucillo, 28.155005, -105.553476  
            P0298, deliciassaucillo, 28.155455, -105.549637  
            P0299, deliciassaucillo, 28.15469, -105.558687  
            P0300, deliciassaucillo, 28.15496, -105.546483  
            P0301, deliciassaucillo, 28.154645, -105.543995  
            P0302, deliciassaucillo, 28.15496, -105.541556  
            P0303, deliciassaucillo, 28.154285, -105.33424  
            P0304, deliciassaucillo, 28.15451, -105.42461  
            P0305, deliciassaucillo, 28.154375, -105.426765  
            P0306, deliciassaucillo, 28.15478, -105.534783  
            P0307, deliciassaucillo, 28.15406, -105.55637  
            P0308, deliciassaucillo, 28.154105, -105.33743  
            P0309, deliciassaucillo, 28.153835, -105.495125  
            P0310, deliciassaucillo, 28.153745, -105.500695  
            P0311, deliciassaucillo, 28.153565, -105.350959  
            P0312, deliciassaucillo, 28.153745, -105.449405  
            P0313, deliciassaucillo, 28.153835, -105.504032  
            P0314, deliciassaucillo, 28.153205, -105.35447  
            P0315, deliciassaucillo, 28.153475, -105.383195  
            P0316, deliciassaucillo, 28.153205, -105.393589  
            P0317, deliciassaucillo, 28.15316, -105.420415  
            P0318, deliciassaucillo, 28.1532, -105.32652  
            P0319, deliciassaucillo, 28.152625, -105.44192  
            P0320, deliciassaucillo, 28.15258, -105.390025  
            P0321, deliciassaucillo, 28.153525, -105.497522  
            P0322, deliciassaucillo, 28.152675, -105.476463  
            P0323, deliciassaucillo, 28.152935, -105.334105  
            P0324, deliciassaucillo, 28.152805, -105.528199  
            P0325, deliciassaucillo, 28.153525, -105.412824  
            P0326, deliciassaucillo, 28.15276, -105.559025  
            P0327, deliciassaucillo, 28.152585, -105.461787  
            P0328, deliciassaucillo, 28.152585, -105.406001  
            P0329, deliciassaucillo, 28.152675, -105.517669  
            P0330, deliciassaucillo, 28.15191, -105.430366  
            P0331, deliciassaucillo, 28.15218, -105.457698  
            P0332, deliciassaucillo, 28.152225, -105.549547  
            P0333, deliciassaucillo, 28.15209, -105.402394  
            P0334, deliciassaucillo, 28.15245, -105.386075  
            P0335, deliciassaucillo, 28.1524, -105.359705  
            P0336, deliciassaucillo, 28.15267, -105.446056  
            P0337, deliciassaucillo, 28.151685, -105.493124  
            P0338, deliciassaucillo, 28.152045, -105.335405  
            P0339, deliciassaucillo, 28.151685, -105.49517  
            P0340, deliciassaucillo, 28.15173, -105.557245  
            P0341, deliciassaucillo, 28.15182, -105.481718  
            P0342, deliciassaucillo, 28.15074, -105.452124  
            P0343, deliciassaucillo, 28.15155, -105.465305  
            P0344, deliciassaucillo, 28.151595, -105.397742  
            P0345, deliciassaucillo, 28.150785, -105.470253  
            P0346, deliciassaucillo, 28.15146, -105.326233  
            P0347, deliciassaucillo, 28.151055, -105.55943  
            P0348, deliciassaucillo, 28.151055, -105.491309  
            P0349, deliciassaucillo, 28.150695, -105.379358  
            P0350, deliciassaucillo, 28.150695, -105.5433  
            P0351, deliciassaucillo, 28.150335, -105.555675  
            P0352, deliciassaucillo, 28.15065, -105.354404  
            P0353, deliciassaucillo, 28.15101, -105.476664  
            P0354, deliciassaucillo, 28.149705, -105.327745  
            P0355, deliciassaucillo, 28.14894, -105.537803  
            P0356, deliciassaucillo, 28.149075, -105.346364  
            P0357, deliciassaucillo, 28.149705, -105.434044  
            P0358, deliciassaucillo, 28.14939, -105.334485  
            P0359, deliciassaucillo, 28.149345, -105.505185  
            P0360, deliciassaucillo, 28.149075, -105.359053  
            P0361, deliciassaucillo, 28.149075, -105.55383  
            P0362, deliciassaucillo, 28.148985, -105.54404  
            P0363, deliciassaucillo, 28.148895, -105.405107  
            P0364, deliciassaucillo, 28.149615, -105.385031  
            P0365, deliciassaucillo, 28.148805, -105.449945  
            P0366, deliciassaucillo, 28.148445, -105.557041  
            P0367, deliciassaucillo, 28.14948, -105.420748  
            P0368, deliciassaucillo, 28.148985, -105.444778  
            P0369, deliciassaucillo, 28.148985, -105.396585  
            P0370, deliciassaucillo, 28.148625, -105.400805  
            P0371, deliciassaucillo, 28.147995, -105.549285  
            P0372, deliciassaucillo, 28.14836, -105.456197  
            P0373, deliciassaucillo, 28.148355, -105.54606  
            P0374, deliciassaucillo, 28.148175, -105.463352  
            P0375, deliciassaucillo, 28.1484, -105.494909  
            P0376, deliciassaucillo, 28.147325, -105.460197  
            P0377, deliciassaucillo, 28.147905, -105.32535  
            P0378, deliciassaucillo, 28.146695, -105.521065  
            P0379, deliciassaucillo, 28.147995, -105.519875  
            P0380, deliciassaucillo, 28.147995, -105.334577  
            P0381, deliciassaucillo, 28.148085, -105.485809  
            P0382, deliciassaucillo, 28.147505, -105.471976  
            P0383, deliciassaucillo, 28.14777, -105.492013  
            P0384, deliciassaucillo, 28.147455, -105.486325  
            P0385, deliciassaucillo, 28.147415, -105.379155  
            P0386, deliciassaucillo, 28.147505, -105.481427  
            P0387, deliciassaucillo, 28.148355, -105.4773  
            P0388, deliciassaucillo, 28.147235, -105.44199  
            P0389, deliciassaucillo, 28.146385, -105.351808  
            P0390, deliciassaucillo, 28.146655, -105.423665  
            P0391, deliciassaucillo, 28.146565, -105.32418  
            P0392, deliciassaucillo, 28.14613, -105.333943  
            P0393, deliciassaucillo, 28.145755, -105.5528  
            P0394, deliciassaucillo, 28.145845, -105.54285  
            P0395, deliciassaucillo, 28.14544, -105.556232  
            P0396, deliciassaucillo, 28.145755, -105.47033  
            P0397, deliciassaucillo, 28.145665, -105.32791  
            P0398, deliciassaucillo, 28.145485, -105.49369  
            P0399, deliciassaucillo, 28.145215, -105.39878  
            P0400, deliciassaucillo, 28.145845, -105.55858  
            P0401, deliciassaucillo, 28.145305, -105.348278  
            P0402, deliciassaucillo, 28.145215, -105.549475  
            P0403, deliciassaucillo, 28.144765, -105.358075  
            P0404, deliciassaucillo, 28.145035, -105.447051  
            P0405, deliciassaucillo, 28.1449, -105.326332  
            P0406, deliciassaucillo, 28.144765, -105.481337  
            P0407, deliciassaucillo, 28.14472, -105.440555  
            P0408, deliciassaucillo, 28.14553, -105.53359  
            P0409, deliciassaucillo, 28.143595, -105.509032  
            P0410, deliciassaucillo, 28.14436, -105.471065  
            P0411, deliciassaucillo, 28.14481, -105.54615  
            P0412, deliciassaucillo, 28.144405, -105.404807  
            P0413, deliciassaucillo, 28.144045, -105.370232  
            P0414, deliciassaucillo, 28.14418, -105.466995  
            P0415, deliciassaucillo, 28.14445, -105.321907  
            P0416, deliciassaucillo, 28.14427, -105.46027  
            P0417, deliciassaucillo, 28.14373, -105.455825  
            P0418, deliciassaucillo, 28.143145, -105.328355  
            P0419, deliciassaucillo, 28.14373, -105.392911  
            P0420, deliciassaucillo, 28.14337, -105.447047  
            P0421, deliciassaucillo, 28.143195, -105.43022  
            P0422, deliciassaucillo, 28.142785, -105.481565  
            P0423, deliciassaucillo, 28.14283, -105.463235  
            P0424, deliciassaucillo, 28.14301, -105.51641  
            P0425, deliciassaucillo, 28.142835, -105.440536  
            P0426, deliciassaucillo, 28.142335, -105.513005  
            P0427, deliciassaucillo, 28.142515, -105.556795  
            P0428, deliciassaucillo, 28.142605, -105.344087  
            P0429, deliciassaucillo, 28.142245, -105.549385  
            P0430, deliciassaucillo, 28.142075, -105.353473  
            P0431, deliciassaucillo, 28.141265, -105.535797  
            P0432, deliciassaucillo, 28.141175, -105.36779  
            P0433, deliciassaucillo, 28.14023, -105.465598  
            P0434, deliciassaucillo, 28.14189, -105.373922  
            P0435, deliciassaucillo, 28.14086, -105.480825  
            P0436, deliciassaucillo, 28.140995, -105.467327  
            P0437, deliciassaucillo, 28.140455, -105.445786  
            P0438, deliciassaucillo, 28.140545, -105.475796  
            P0439, deliciassaucillo, 28.13987, -105.46418  
            P0440, deliciassaucillo, 28.13996, -105.360245  
            P0441, deliciassaucillo, 28.138655, -105.542022  
            P0442, deliciassaucillo, 28.13933, -105.46051  
            P0443, deliciassaucillo, 28.13978, -105.51411  
            P0444, deliciassaucillo, 28.139645, -105.324355  
            P0445, deliciassaucillo, 28.13969, -105.440443  
            P0446, deliciassaucillo, 28.139735, -105.557605  
            P0447, deliciassaucillo, 28.139465, -105.429329  
            P0448, deliciassaucillo, 28.141175, -105.522136  
            P0449, deliciassaucillo, 28.13915, -105.488241  
            P0450, deliciassaucillo, 28.139015, -105.545077  
            P0451, deliciassaucillo, 28.13897, -105.334765  
            P0452, deliciassaucillo, 28.13888, -105.401255  
            P0453, deliciassaucillo, 28.13951, -105.455804  
            P0454, deliciassaucillo, 28.138475, -105.33936  
            P0455, deliciassaucillo, 28.138655, -105.549316  
            P0456, deliciassaucillo, 28.13861, -105.53575  
            P0457, deliciassaucillo, 28.137935, -105.352727  
            P0458, deliciassaucillo, 28.138295, -105.435428  
            P0459, deliciassaucillo, 28.137935, -105.552755  
            P0460, deliciassaucillo, 28.13753, -105.444713  
            P0461, deliciassaucillo, 28.13708, -105.44723  
            P0462, deliciassaucillo, 28.13708, -105.485222  
            P0463, deliciassaucillo, 28.136765, -105.34093  
            P0464, deliciassaucillo, 28.1369, -105.5117  
            P0465, deliciassaucillo, 28.13551, -105.515942  
            P0466, deliciassaucillo, 28.136675, -105.468359  
            P0467, deliciassaucillo, 28.136765, -105.471703  
            P0468, deliciassaucillo, 28.13668, -105.450698  
            P0469, deliciassaucillo, 28.13628, -105.420585  
            P0470, deliciassaucillo, 28.136415, -105.331146  
            P0471, deliciassaucillo, 28.136235, -105.48709  
            P0472, deliciassaucillo, 28.136545, -105.51381  
            P0473, deliciassaucillo, 28.136415, -105.342216  
            P0474, deliciassaucillo, 28.136545, -105.440488  
            P0475, deliciassaucillo, 28.136455, -105.411745  
            P0476, deliciassaucillo, 28.13605, -105.502291  
            P0477, deliciassaucillo, 28.13547, -105.394965  
            P0478, deliciassaucillo, 28.13556, -105.350005  
            P0479, deliciassaucillo, 28.135875, -105.457114  
            P0480, deliciassaucillo, 28.1352, -105.47936  
            P0481, deliciassaucillo, 28.1343, -105.533967  
            P0482, deliciassaucillo, 28.13403, -105.496782  
            P0483, deliciassaucillo, 28.134655, -105.556143  
            P0484, deliciassaucillo, 28.134795, -105.528269  
            P0485, deliciassaucillo, 28.134525, -105.508223  
            P0486, deliciassaucillo, 28.13475, -105.435547  
            P0487, deliciassaucillo, 28.134345, -105.553427  
            P0488, deliciassaucillo, 28.134615, -105.547365  
            P0489, deliciassaucillo, 28.13439, -105.420581  
            P0490, deliciassaucillo, 28.134795, -105.334869  
            P0491, deliciassaucillo, 28.134705, -105.35041  
            P0492, deliciassaucillo, 28.134165, -105.55862  
            P0493, deliciassaucillo, 28.135105, -105.429295  
            P0494, deliciassaucillo, 28.134255, -105.444385  
            P0495, deliciassaucillo, 28.134075, -105.35872  
            P0496, deliciassaucillo, 28.13484, -105.384608  
            P0497, deliciassaucillo, 28.13219, -105.474172  
            P0498, deliciassaucillo, 28.133445, -105.376932  
            P0499, deliciassaucillo, 28.133445, -105.381675  
            P0500, deliciassaucillo, 28.133625, -105.446748  
            P0501, deliciassaucillo, 28.13394, -105.502085  
            P0502, deliciassaucillo, 28.133265, -105.34376  
            P0503, deliciassaucillo, 28.133715, -105.391666  
            P0504, deliciassaucillo, 28.134615, -105.424453  
            P0505, deliciassaucillo, 28.13394, -105.521216  
            P0506, deliciassaucillo, 28.13385, -105.406858  
            P0507, deliciassaucillo, 28.133265, -105.334251  
            P0508, deliciassaucillo, 28.132815, -105.395093  
            P0509, deliciassaucillo, 28.13232, -105.440452  
            P0510, deliciassaucillo, 28.132905, -105.353698  
            P0511, deliciassaucillo, 28.132995, -105.457415  
            P0512, deliciassaucillo, 28.13214, -105.512771  
            P0513, deliciassaucillo, 28.13241, -105.35063  
            P0514, deliciassaucillo, 28.13286, -105.530025  
            P0515, deliciassaucillo, 28.13241, -105.46216  
            P0516, deliciassaucillo, 28.13187, -105.445525  
            P0517, deliciassaucillo, 28.13156, -105.34448  
            P0518, deliciassaucillo, 28.13151, -105.355547  
            P0519, deliciassaucillo, 28.13129, -105.320765  
            P0520, deliciassaucillo, 28.132185, -105.389984  
            P0521, deliciassaucillo, 28.13116, -105.435895  
            P0522, deliciassaucillo, 28.130935, -105.34852  
            P0523, deliciassaucillo, 28.130755, -105.4728  
            P0524, deliciassaucillo, 28.131065, -105.35072  
            P0525, deliciassaucillo, 28.13093, -105.509175  
            P0526, deliciassaucillo, 28.130755, -105.35737  
            P0527, deliciassaucillo, 28.131065, -105.515994  
            P0528, deliciassaucillo, 28.13092, -105.469673  
            P0529, deliciassaucillo, 28.13057, -105.369203  
            P0530, deliciassaucillo, 28.130215, -105.45695  
            P0531, deliciassaucillo, 28.130705, -105.365207  
            P0532, deliciassaucillo, 28.13035, -105.34021  
            P0533, deliciassaucillo, 28.131245, -105.323712  
            P0534, deliciassaucillo, 28.129585, -105.337299  
            P0535, deliciassaucillo, 28.130125, -105.32966  
            P0536, deliciassaucillo, 28.129945, -105.416435  
            P0537, deliciassaucillo, 28.12981, -105.550353  
            P0538, deliciassaucillo, 28.13012, -105.557491  
            P0539, deliciassaucillo, 28.13017, -105.35975  
            P0540, deliciassaucillo, 28.13008, -105.343438  
            P0541, deliciassaucillo, 28.129585, -105.475226  
            P0542, deliciassaucillo, 28.129045, -105.506265  
            P0543, deliciassaucillo, 28.129405, -105.38396  
            P0544, deliciassaucillo, 28.129675, -105.326785  
            P0545, deliciassaucillo, 28.129315, -105.33617  
            P0546, deliciassaucillo, 28.12873, -105.34201  
            P0547, deliciassaucillo, 28.12855, -105.333426  
            P0548, deliciassaucillo, 28.128145, -105.417605  
            P0549, deliciassaucillo, 28.129765, -105.535672  
            P0550, deliciassaucillo, 28.127965, -105.502839  
            P0551, deliciassaucillo, 28.127695, -105.52639  
            P0552, deliciassaucillo, 28.12774, -105.421318  
            P0553, deliciassaucillo, 28.127605, -105.470533  
            P0554, deliciassaucillo, 28.127875, -105.51624  
            P0555, deliciassaucillo, 28.12747, -105.342235  
            P0556, deliciassaucillo, 28.12738, -105.348474  
            P0557, deliciassaucillo, 28.127245, -105.509588  
            P0558, deliciassaucillo, 28.12702, -105.359845  
            P0559, deliciassaucillo, 28.12729, -105.327444  
            P0560, deliciassaucillo, 28.127785, -105.49944  
            P0561, deliciassaucillo, 28.127425, -105.357196  
            P0562, deliciassaucillo, 28.126705, -105.392  
            P0563, deliciassaucillo, 28.1277, -105.519322  
            P0564, deliciassaucillo, 28.126165, -105.379024  
            P0565, deliciassaucillo, 28.12675, -105.34437  
            P0566, deliciassaucillo, 28.12599, -105.389149  
            P0567, deliciassaucillo, 28.125855, -105.352645  
            P0568, deliciassaucillo, 28.12635, -105.354685  
            P0569, deliciassaucillo, 28.125455, -105.368765  
            P0570, deliciassaucillo, 28.125635, -105.472843  
            P0571, deliciassaucillo, 28.125185, -105.35099  
            P0572, deliciassaucillo, 28.125405, -105.556274  
            P0573, deliciassaucillo, 28.12599, -105.558836  
            P0574, deliciassaucillo, 28.125815, -105.333807  
            P0575, deliciassaucillo, 28.125185, -105.346635  
            P0576, deliciassaucillo, 28.125005, -105.327905  
            P0577, deliciassaucillo, 28.12487, -105.509455  
            P0578, deliciassaucillo, 28.124465, -105.320585  
            P0579, deliciassaucillo, 28.12433, -105.349465  
            P0580, deliciassaucillo, 28.12415, -105.34219  
            P0581, deliciassaucillo, 28.124105, -105.389515  
            P0582, deliciassaucillo, 28.123925, -105.50649  
            P0583, deliciassaucillo, 28.12424, -105.36065  
            P0584, deliciassaucillo, 28.124555, -105.547865  
            P0585, deliciassaucillo, 28.12271, -105.343462  
            P0586, deliciassaucillo, 28.12244, -105.348709  
            P0587, deliciassaucillo, 28.12226, -105.34021  
            P0588, deliciassaucillo, 28.122575, -105.352655  
            P0589, deliciassaucillo, 28.122305, -105.35508  
            P0590, deliciassaucillo, 28.12226, -105.380048  
            P0591, deliciassaucillo, 28.12217, -105.426585  
            P0592, deliciassaucillo, 28.11939, -105.55376  
            P0593, deliciassaucillo, 28.122305, -105.35854  
            P0594, deliciassaucillo, 28.122035, -105.49445  
            P0595, deliciassaucillo, 28.121675, -105.3841  
            P0596, deliciassaucillo, 28.121585, -105.334452  
            P0597, deliciassaucillo, 28.12109, -105.51573  
            P0598, deliciassaucillo, 28.12208, -105.36891  
            P0599, deliciassaucillo, 28.121315, -105.342055  
            P0600, deliciassaucillo, 28.12082, -105.499414  
            P0601, deliciassaucillo, 28.121135, -105.358952  
            P0602, deliciassaucillo, 28.120645, -105.460689  
            P0603, deliciassaucillo, 28.12145, -105.344705  
            P0604, deliciassaucillo, 28.121135, -105.347369  
            P0605, deliciassaucillo, 28.120465, -105.540977  
            P0606, deliciassaucillo, 28.12096, -105.533545  
            P0607, deliciassaucillo, 28.121365, -105.52711  
            P0608, deliciassaucillo, 28.120825, -105.328012  
            P0609, deliciassaucillo, 28.116285, -105.402904  
            P0610, deliciassaucillo, 28.120375, -105.529895  
            P0611, deliciassaucillo, 28.120335, -105.41971  
            P0612, deliciassaucillo, 28.119975, -105.490252  
            P0613, deliciassaucillo, 28.11961, -105.352385  
            P0614, deliciassaucillo, 28.11948, -105.343088  
            P0615, deliciassaucillo, 28.119345, -105.354433  
            P0616, deliciassaucillo, 28.120465, -105.557545  
            P0617, deliciassaucillo, 28.119525, -105.350005  
            P0618, deliciassaucillo, 28.118985, -105.346815  
            P0619, deliciassaucillo, 28.119165, -105.33671  
            P0620, deliciassaucillo, 28.118895, -105.35872  
            P0621, deliciassaucillo, 28.11858, -105.331097  
            P0622, deliciassaucillo, 28.117815, -105.432587  
            P0623, deliciassaucillo, 28.11768, -105.369291  
            P0624, deliciassaucillo, 28.11804, -105.49905  
            P0625, deliciassaucillo, 28.117815, -105.326155  
            P0626, deliciassaucillo, 28.11777, -105.379352  
            P0627, deliciassaucillo, 28.118805, -105.520527  
            P0628, deliciassaucillo, 28.117545, -105.363947  
            P0629, deliciassaucillo, 28.11741, -105.343519  
            P0630, deliciassaucillo, 28.11692, -105.534385  
            P0631, deliciassaucillo, 28.1166, -105.350182  
            P0632, deliciassaucillo, 28.117725, -105.551205  
            P0633, deliciassaucillo, 28.11723, -105.539669  
            P0634, deliciassaucillo, 28.11678, -105.3845  
            P0635, deliciassaucillo, 28.11687, -105.373825  
            P0636, deliciassaucillo, 28.116555, -105.547252  
            P0637, deliciassaucillo, 28.11642, -105.510282  
            P0638, deliciassaucillo, 28.116825, -105.39471  
            P0639, deliciassaucillo, 28.11687, -105.527132  
            P0640, deliciassaucillo, 28.11606, -105.46913  
            P0641, deliciassaucillo, 28.116555, -105.354945  
            P0642, deliciassaucillo, 28.116195, -105.330642  
            P0643, deliciassaucillo, 28.115745, -105.370508  
            P0644, deliciassaucillo, 28.11588, -105.497492  
            P0645, deliciassaucillo, 28.115615, -105.352542  
            P0646, deliciassaucillo, 28.115125, -105.503547  
            P0647, deliciassaucillo, 28.115885, -105.379314  
            P0648, deliciassaucillo, 28.11557, -105.339045  
            P0649, deliciassaucillo, 28.115485, -105.35782  
            P0650, deliciassaucillo, 28.114495, -105.349621  
            P0651, deliciassaucillo, 28.11463, -105.432218  
            P0652, deliciassaucillo, 28.11409, -105.360209  
            P0653, deliciassaucillo, 28.11472, -105.362805  
            P0654, deliciassaucillo, 28.11481, -105.3549  
            P0655, deliciassaucillo, 28.11521, -105.365254  
            P0656, deliciassaucillo, 28.114585, -105.333542  
            P0657, deliciassaucillo, 28.11427, -105.466245  
            P0658, deliciassaucillo, 28.114225, -105.461443  
            P0659, deliciassaucillo, 28.114045, -105.51992  
            P0660, deliciassaucillo, 28.11409, -105.426855  
            P0661, deliciassaucillo, 28.113505, -105.379262  
            P0662, deliciassaucillo, 28.1131, -105.357595  
            P0663, deliciassaucillo, 28.112785, -105.35499  
            P0664, deliciassaucillo, 28.11283, -105.35243  
            P0665, deliciassaucillo, 28.112155, -105.373697  
            P0666, deliciassaucillo, 28.112065, -105.388264  
            P0667, deliciassaucillo, 28.11265, -105.498022  
            P0668, deliciassaucillo, 28.112335, -105.329332  
            P0669, deliciassaucillo, 28.112065, -105.42964  
            P0670, deliciassaucillo, 28.112065, -105.33909  
            P0671, deliciassaucillo, 28.11193, -105.36617  
            P0672, deliciassaucillo, 28.11211, -105.493488  
            P0673, deliciassaucillo, 28.11166, -105.362955  
            P0674, deliciassaucillo, 28.111705, -105.3496  
            P0675, deliciassaucillo, 28.11175, -105.343571  
            P0676, deliciassaucillo, 28.112335, -105.436346  
            P0677, deliciassaucillo, 28.11148, -105.355485  
            P0678, deliciassaucillo, 28.111435, -105.379327  
            P0679, deliciassaucillo, 28.111345, -105.35701  
            P0680, deliciassaucillo, 28.110895, -105.325615  
            P0681, deliciassaucillo, 28.110805, -105.45969  
            P0682, deliciassaucillo, 28.110715, -105.330825  
            P0683, deliciassaucillo, 28.11013, -105.529538  
            P0684, deliciassaucillo, 28.110265, -105.390505  
            P0685, deliciassaucillo, 28.110355, -105.396355  
            P0686, deliciassaucillo, 28.109285, -105.416705  
            P0687, deliciassaucillo, 28.109905, -105.520794  
            P0688, deliciassaucillo, 28.108835, -105.510395  
            P0689, deliciassaucillo, 28.108835, -105.545835  
            P0690, deliciassaucillo, 28.107845, -105.377614  
            P0691, deliciassaucillo, 28.109015, -105.352754  
            P0692, deliciassaucillo, 28.10807, -105.35025  
            P0693, deliciassaucillo, 28.109105, -105.324727  
            P0694, deliciassaucillo, 28.10834, -105.370395  
            P0695, deliciassaucillo, 28.108565, -105.335275  
            P0696, deliciassaucillo, 28.108205, -105.385141  
            P0697, deliciassaucillo, 28.10735, -105.505635  
            P0698, deliciassaucillo, 28.107305, -105.341927  
            P0699, deliciassaucillo, 28.108565, -105.3655  
            P0700, deliciassaucillo, 28.107755, -105.526189  
            P0701, deliciassaucillo, 28.10762, -105.366957  
            P0702, deliciassaucillo, 28.107485, -105.550069  
            P0703, deliciassaucillo, 28.10816, -105.375403  
            P0704, deliciassaucillo, 28.10717, -105.496065  
            P0705, deliciassaucillo, 28.107395, -105.39665  
            P0706, deliciassaucillo, 28.10735, -105.362985  
            P0707, deliciassaucillo, 28.107485, -105.49134  
            P0708, deliciassaucillo, 28.106675, -105.50694  
            P0709, deliciassaucillo, 28.10708, -105.33801  
            P0710, deliciassaucillo, 28.10591, -105.32764  
            P0711, deliciassaucillo, 28.10627, -105.378958  
            P0712, deliciassaucillo, 28.105685, -105.32269  
            P0713, deliciassaucillo, 28.106, -105.50049  
            P0714, deliciassaucillo, 28.105775, -105.47341  
            P0715, deliciassaucillo, 28.105955, -105.329925  
            P0716, deliciassaucillo, 28.106135, -105.411089  
            P0717, deliciassaucillo, 28.105825, -105.370417  
            P0718, deliciassaucillo, 28.10654, -105.40799  
            P0719, deliciassaucillo, 28.105415, -105.333745  
            P0720, deliciassaucillo, 28.10582, -105.348007  
            P0721, deliciassaucillo, 28.106225, -105.462349  
            P0722, deliciassaucillo, 28.10555, -105.360075  
            P0723, deliciassaucillo, 28.105235, -105.389526  
            P0724, deliciassaucillo, 28.105235, -105.393165  
            P0725, deliciassaucillo, 28.10439, -105.339433  
            P0726, deliciassaucillo, 28.103535, -105.380635  
            P0727, deliciassaucillo, 28.102905, -105.531883  
            P0728, deliciassaucillo, 28.10295, -105.326515  
            P0729, deliciassaucillo, 28.103445, -105.36762  
            P0730, deliciassaucillo, 28.103085, -105.320646  
            P0731, deliciassaucillo, 28.102455, -105.477759  
            P0732, deliciassaucillo, 28.102545, -105.375086  
            P0733, deliciassaucillo, 28.102815, -105.334446  
            P0734, deliciassaucillo, 28.102545, -105.482309  
            P0735, deliciassaucillo, 28.10214, -105.338692  
            P0736, deliciassaucillo, 28.10232, -105.502134  
            P0737, deliciassaucillo, 28.102005, -105.37965  
            P0738, deliciassaucillo, 28.101195, -105.469873  
            P0739, deliciassaucillo, 28.101735, -105.353991  
            P0740, deliciassaucillo, 28.10259, -105.329983  
            P0741, deliciassaucillo, 28.10115, -105.347881  
            P0742, deliciassaucillo, 28.102095, -105.516702  
            P0743, deliciassaucillo, 28.10115, -105.35041  
            P0744, deliciassaucillo, 28.10124, -105.343738  
            P0745, deliciassaucillo, 28.100925, -105.496974  
            P0746, deliciassaucillo, 28.100565, -105.403292  
            P0747, deliciassaucillo, 28.100115, -105.321316  
            P0748, deliciassaucillo, 28.09985, -105.333721  
            P0749, deliciassaucillo, 28.099575, -105.32404  
            P0750, deliciassaucillo, 28.098685, -105.368375  
            P0751, deliciassaucillo, 28.09935, -105.32737  
            P0752, deliciassaucillo, 28.09976, -105.3805  
            P0753, deliciassaucillo, 28.098905, -105.501484  
            P0754, deliciassaucillo, 28.098455, -105.370442  
            P0755, deliciassaucillo, 28.099085, -105.36267  
            P0756, deliciassaucillo, 28.09976, -105.337387  
            P0757, deliciassaucillo, 28.098635, -105.523248  
            P0758, deliciassaucillo, 28.09868, -105.352508  
            P0759, deliciassaucillo, 28.097875, -105.39344  
            P0760, deliciassaucillo, 28.097785, -105.536261  
            P0761, deliciassaucillo, 28.097515, -105.527425  
            P0762, deliciassaucillo, 28.098235, -105.546407  
            P0763, deliciassaucillo, 28.097875, -105.34792  
            P0764, deliciassaucillo, 28.097965, -105.32292  
            P0765, deliciassaucillo, 28.09801, -105.334666  
            P0766, deliciassaucillo, 28.09774, -105.32126  
            P0767, deliciassaucillo, 28.097785, -105.40085  
            P0768, deliciassaucillo, 28.09738, -105.32952  
            P0769, deliciassaucillo, 28.09756, -105.477025  
            P0770, deliciassaucillo, 28.096705, -105.35899  
            P0771, deliciassaucillo, 28.09711, -105.38023  
            P0772, deliciassaucillo, 28.096435, -105.482934  
            P0773, deliciassaucillo, 28.09684, -105.501262  
            P0774, deliciassaucillo, 28.096615, -105.374783  
            P0775, deliciassaucillo, 28.096435, -105.459577  
            P0776, deliciassaucillo, 28.096345, -105.466909  
            P0777, deliciassaucillo, 28.09621, -105.457175  
            P0778, deliciassaucillo, 28.09639, -105.365275  
            P0779, deliciassaucillo, 28.09549, -105.362918  
            P0780, deliciassaucillo, 28.096435, -105.349278  
            P0781, deliciassaucillo, 28.095265, -105.354878  
            P0782, deliciassaucillo, 28.094995, -105.395618  
            P0783, deliciassaucillo, 28.09455, -105.368713  
            P0784, deliciassaucillo, 28.09486, -105.324805  
            P0785, deliciassaucillo, 28.09446, -105.379263  
            P0786, deliciassaucillo, 28.09401, -105.334752  
            P0787, deliciassaucillo, 28.094505, -105.34376  
            P0788, deliciassaucillo, 28.09437, -105.33231  
            P0789, deliciassaucillo, 28.094235, -105.385715  
            P0790, deliciassaucillo, 28.094365, -105.336822  
            P0791, deliciassaucillo, 28.095045, -105.34021  
            P0792, deliciassaucillo, 28.094105, -105.519273  
            P0793, deliciassaucillo, 28.094415, -105.511519  
            P0794, deliciassaucillo, 28.094635, -105.358068  
            P0795, deliciassaucillo, 28.094145, -105.450654  
            P0796, deliciassaucillo, 28.0941, -105.51395  
            P0797, deliciassaucillo, 28.093475, -105.360785  
            P0798, deliciassaucillo, 28.09316, -105.328328  
            P0799, deliciassaucillo, 28.09316, -105.324355  
            P0800, deliciassaucillo, 28.0928, -105.48188  
            P0801, deliciassaucillo, 28.092755, -105.38621  
            P0802, deliciassaucillo, 28.093695, -105.351395  
            P0803, deliciassaucillo, 28.09145, -105.533195  
            P0804, deliciassaucillo, 28.091585, -105.514485  
            P0805, deliciassaucillo, 28.09145, -105.38297  
            P0806, deliciassaucillo, 28.090775, -105.386385  
            P0807, deliciassaucillo, 28.090325, -105.360092  
            P0808, deliciassaucillo, 28.09109, -105.39093  
            P0809, deliciassaucillo, 28.09028, -105.512278  
            P0810, deliciassaucillo, 28.09019, -105.371744  
            P0811, deliciassaucillo, 28.09019, -105.337385  
            P0812, deliciassaucillo, 28.08956, -105.348875  
            P0813, deliciassaucillo, 28.090775, -105.332445  
            P0814, deliciassaucillo, 28.0901, -105.392985  
            P0815, deliciassaucillo, 28.089925, -105.326943  
            P0816, deliciassaucillo, 28.088935, -105.329393  
            P0817, deliciassaucillo, 28.08997, -105.334736  
            P0818, deliciassaucillo, 28.089835, -105.34376  
            P0819, deliciassaucillo, 28.08979, -105.339923  
            P0820, deliciassaucillo, 28.09028, -105.551266  
            P0821, deliciassaucillo, 28.08947, -105.540127  
            P0822, deliciassaucillo, 28.089785, -105.323482  
            P0823, deliciassaucillo, 28.088305, -105.49989  
            P0824, deliciassaucillo, 28.089155, -105.52778  
            P0825, deliciassaucillo, 28.08893, -105.384106  
            P0826, deliciassaucillo, 28.087995, -105.5232  
            P0827, deliciassaucillo, 28.08831, -105.388908  
            P0828, deliciassaucillo, 28.087545, -105.355179  
            P0829, deliciassaucillo, 28.087635, -105.35823  
            P0830, deliciassaucillo, 28.08732, -105.51804  
            P0831, deliciassaucillo, 28.087045, -105.320405  
            P0832, deliciassaucillo, 28.087095, -105.393345  
            P0833, deliciassaucillo, 28.08732, -105.45816  
            P0834, deliciassaucillo, 28.08696, -105.536607  
            P0835, deliciassaucillo, 28.08741, -105.36327  
            P0836, deliciassaucillo, 28.08678, -105.3284  
            P0837, deliciassaucillo, 28.08687, -105.437455  
            P0838, deliciassaucillo, 28.08669, -105.323664  
            P0839, deliciassaucillo, 28.086015, -105.369744  
            P0840, deliciassaucillo, 28.085655, -105.479495  
            P0841, deliciassaucillo, 28.08633, -105.343744  
            P0842, deliciassaucillo, 28.08579, -105.377183  
            P0843, deliciassaucillo, 28.085835, -105.389643  
            P0844, deliciassaucillo, 28.086285, -105.365815  
            P0845, deliciassaucillo, 28.08588, -105.33864  
            P0846, deliciassaucillo, 28.083945, -105.508385  
            P0847, deliciassaucillo, 28.085385, -105.348409  
            P0848, deliciassaucillo, 28.085925, -105.333565  
            P0849, deliciassaucillo, 28.085025, -105.35746  
            P0850, deliciassaucillo, 28.08462, -105.483  
            P0851, deliciassaucillo, 28.084895, -105.486677  
            P0852, deliciassaucillo, 28.08489, -105.533335  
            P0853, deliciassaucillo, 28.084665, -105.328396  
            P0854, deliciassaucillo, 28.087365, -105.492454  
            P0855, deliciassaucillo, 28.084485, -105.54063  
            P0856, deliciassaucillo, 28.08426, -105.324805  
            P0857, deliciassaucillo, 28.08274, -105.471249  
            P0858, deliciassaucillo, 28.083815, -105.520635  
            P0859, deliciassaucillo, 28.08386, -105.32036  
            P0860, deliciassaucillo, 28.084215, -105.393035  
            P0861, deliciassaucillo, 28.084305, -105.36249  
            P0862, deliciassaucillo, 28.08417, -105.384585  
            P0863, deliciassaucillo, 28.08408, -105.34556  
            P0864, deliciassaucillo, 28.08386, -105.3218  
            P0865, deliciassaucillo, 28.083235, -105.39618  
            P0866, deliciassaucillo, 28.08404, -105.388248  
            P0867, deliciassaucillo, 28.082695, -105.368319  
            P0868, deliciassaucillo, 28.08211, -105.448077  
            P0869, deliciassaucillo, 28.08238, -105.454362  
            P0870, deliciassaucillo, 28.081705, -105.537345  
            P0871, deliciassaucillo, 28.081435, -105.46274  
            P0872, deliciassaucillo, 28.08085, -105.353955  
            P0873, deliciassaucillo, 28.08112, -105.323441  
            P0874, deliciassaucillo, 28.081795, -105.33751  
            P0875, deliciassaucillo, 28.08058, -105.366555  
            P0876, deliciassaucillo, 28.08112, -105.32737  
            P0877, deliciassaucillo, 28.080355, -105.349079  
            P0878, deliciassaucillo, 28.080445, -105.333565  
            P0879, deliciassaucillo, 28.079815, -105.363629  
            P0880, deliciassaucillo, 28.07977, -105.32036  
            P0881, deliciassaucillo, 28.0795, -105.523473  
            P0882, deliciassaucillo, 28.079725, -105.552981  
            P0883, deliciassaucillo, 28.07766, -105.379478  
            P0884, deliciassaucillo, 28.079095, -105.465935  
            P0885, deliciassaucillo, 28.078375, -105.467393  
            P0886, deliciassaucillo, 28.07829, -105.458115  
            P0887, deliciassaucillo, 28.077395, -105.50631  
            P0888, deliciassaucillo, 28.07699, -105.344758  
            P0889, deliciassaucillo, 28.077975, -105.32409  
            P0890, deliciassaucillo, 28.077305, -105.357573  
            P0891, deliciassaucillo, 28.076895, -105.384516  
            P0892, deliciassaucillo, 28.077215, -105.4949  
            P0893, deliciassaucillo, 28.078065, -105.529389  
            P0894, deliciassaucillo, 28.076585, -105.33855  
            P0895, deliciassaucillo, 28.07699, -105.362355  
            P0896, deliciassaucillo, 28.076765, -105.559205  
            P0897, deliciassaucillo, 28.07712, -105.333565  
            P0898, deliciassaucillo, 28.07667, -105.353865  
            P0899, deliciassaucillo, 28.07654, -105.320405  
            P0900, deliciassaucillo, 28.076405, -105.328971  
            P0901, deliciassaucillo, 28.07766, -105.514055  
            P0902, deliciassaucillo, 28.075235, -105.558755  
            P0903, deliciassaucillo, 28.075325, -105.323797  
            P0904, deliciassaucillo, 28.07519, -105.348734  
            P0905, deliciassaucillo, 28.07528, -105.45358  
            P0906, deliciassaucillo, 28.07564, -105.462515  
            P0907, deliciassaucillo, 28.074965, -105.320405  
            P0908, deliciassaucillo, 28.074965, -105.375765  
            P0909, deliciassaucillo, 28.075595, -105.483104  
            P0910, deliciassaucillo, 28.074155, -105.334172  
            P0911, deliciassaucillo, 28.074065, -105.381045  
            P0912, deliciassaucillo, 28.073755, -105.476515  
            P0913, deliciassaucillo, 28.074515, -105.368806  
            P0914, deliciassaucillo, 28.073615, -105.353865  
            P0915, deliciassaucillo, 28.073705, -105.372978  
            P0916, deliciassaucillo, 28.073255, -105.329255  
            P0917, deliciassaucillo, 28.072815, -105.47249  
            P0918, deliciassaucillo, 28.072725, -105.45394  
            P0919, deliciassaucillo, 28.07241, -105.463327  
            P0920, deliciassaucillo, 28.07272, -105.32036  
            P0921, deliciassaucillo, 28.07241, -105.337087  
            P0922, deliciassaucillo, 28.072905, -105.537117  
            P0923, deliciassaucillo, 28.073305, -105.505711  
            P0924, deliciassaucillo, 28.07169, -105.323765  
            P0925, deliciassaucillo, 28.07196, -105.383645  
            P0926, deliciassaucillo, 28.07353, -105.359972  
            P0927, deliciassaucillo, 28.07263, -105.556375  
            P0928, deliciassaucillo, 28.07259, -105.52607  
            P0929, deliciassaucillo, 28.072855, -105.497668  
            P0930, deliciassaucillo, 28.072045, -105.44913  
            P0931, deliciassaucillo, 28.071195, -105.460284  
            P0932, deliciassaucillo, 28.072095, -105.468201  
            P0933, deliciassaucillo, 28.071915, -105.456245  
            P0934, deliciassaucillo, 28.071465, -105.52832  
            P0935, deliciassaucillo, 28.070835, -105.344705  
            P0936, deliciassaucillo, 28.070925, -105.534256  
            P0937, deliciassaucillo, 28.071105, -105.327865  
            P0938, deliciassaucillo, 28.07097, -105.329615  
            P0939, deliciassaucillo, 28.070835, -105.348121  
            P0940, deliciassaucillo, 28.070385, -105.541435  
    
    Version: This request was processed by AppEEARS version 3.137  

## 2. Request File Listing  

- Comma-separated values file with data extracted for a specific product
  - raiz-ecostress-delicias-saucillo-ECO-L3T-JET-002-results.csv
- Text file with data pool URLs for all source granules used in the extraction
  - raiz-ecostress-delicias-saucillo-granule-list.txt
- JSON request file which can be used in AppEEARS to create a new request
  - raiz-ecostress-delicias-saucillo-request.json
- xml file
  - raiz-ecostress-delicias-saucillo-ECO-L3T-JET-002-metadata.xml  

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
