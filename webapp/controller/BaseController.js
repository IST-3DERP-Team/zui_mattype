sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/core/routing/HashChanger",
    "../js/TableFilter",
    "../js/TableValueHelp"

], function (Controller, JSONModel, MessageBox, Filter, FilterOperator, Sorter, HashChanger, TableFilter, TableValueHelp) {

    "use strict";

    var _this;
    var _aTable = [];
    var _sSbu = "";

    var _sapDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
    var _sapDateFormatPH = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MM/dd/yyyy" });
    var _sapDateTimeFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MM/dd/yyyy HH24:MI:SS" });
    var _sapTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({ pattern: "KK:mm:ss a" });

    return Controller.extend("zuimattype3.controller.BaseController", {

        onInitBase(pThis, pSbu) {
            _this = pThis;
            _sSbu = pSbu;

            this._aColumns = {};
            this._colFilters = {};
            this._aFilterableColumns = {};
            this._aSortableColumns = {};
            this._aInvalidValueState = [];

            this.getView().setModel(new JSONModel({}), "base");

            this.getColumnProp();
            this._tableFilter = TableFilter;
            this._tableValueHelp = TableValueHelp;
        },

        getAppAction: async function() {
            if (sap.ushell.Container !== undefined) {
                const fullHash = new HashChanger().getHash();
                const urlParsing = await sap.ushell.Container.getServiceAsync("URLParsing");
                const shellHash = urlParsing.parseShellHash(fullHash);
                const sAction = shellHash.action;
                var bAppChange;

                if (sAction == "display") bAppChange = false;
                else bAppChange = true;
            } else {
                bAppChange = true;
            }

            _this.getView().getModel("base").setProperty("/appChange", bAppChange);
        },

        getColumns(pTableList) {
            _aTable = pTableList;

            pTableList.forEach(item => {
                setTimeout(() => {
                    // var oTable = _this.byId(item.tblId);
                    // oTable.setModel(new JSONModel(), item.tblModel);

                    _this.getDynamicColumns(item);
                }, 100);
            });
        },

        getColumnProp: async function() {
            var sPath = jQuery.sap.getModulePath("zuimattype3", "/model/columns.json");

            var oModelColumns = new JSONModel();
            await oModelColumns.loadData(sPath);

            _this._oModelColumns = oModelColumns.getData();

            // _this._oModelColumns["hu"].forEach(item => {
            //     item.ColumnName = item.name.toUpperCase()
            // })
        },

        getDynamicColumns: async function(pTable) {
            var modCode = pTable.modCode;
            var tblSrc = pTable.tblSrc;
            var tblId = pTable.tblId;
            var tblModel = pTable.tblModel;

            var oJSONColumnsModel = new JSONModel();
            var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
            oModel.setHeaders({
                sbu: _sSbu,
                type: modCode,
                tabname: tblSrc
            });

            return new Promise((resolve, reject) => {
                oModel.read("/ColumnsSet", {
                    success: function (oData, oResponse) {
                        oJSONColumnsModel.setData(oData);
                        console.log("ColumnsSet", oData)
                        if (oData.results.length > 0) {
                            oData.results.forEach(col => {
                                if (col.ColumnName == "COMPLETE")
                                col.DataType =  "BOOLEAN";
                            })
                            
                            _this._aColumns[tblModel] = _this.setTableColumns(tblId, tblModel, oData.results)["columns"];
                            // //_this.setRowReadMode(tblModel);
                            
                            var tblProps = {
                                aColumns: _this._aColumns[tblModel]
                            };
                            _this.onAfterTableRender(tblId, tblProps);
                            resolve();
                        }
                    },
                    error: function (err) {
                        _this.closeLoadingDialog();
                        resolve();
                    }
                });
            })
        },

        setTableColumns: function(pTable, pModel, pColumn) {
            // var oModel = new JSONModel();
            // oModel.setData({
            //     columns: pColumn,
            //     rows: []
            // });

            var oTable = _this.getView().byId(pTable);

            pColumn.forEach((item) => {
                console.log("pColumn", item);

                var sColumnId = item.ColumnName;
                var sColumnLabel = item.ColumnLabel;
                var sColumnType = item.DataType;
                var sColumnVisible = item.Visible;
                var sColumnSorted = item.Sorted;
                var sColumnSortOrder = item.SortOrder;
                var sColumnWidth = item.ColumnWidth;

                if (sColumnType === "NUMBER") {
                    oTable.addColumn(new sap.m.Column({
                        id: pModel + "-" + sColumnId,
                        width: sColumnWidth + "px",
                        hAlign: "End",
                        header: new sap.m.Label({text: sColumnLabel}),
                        visible: sColumnVisible,
                        demandPopin: true,
                        minScreenWidth: "Desktop"
                    }));
                } else if (sColumnType === "BOOLEAN") {
                    oTable.addColumn(new sap.m.Column({
                        id: pModel + "-" + sColumnId,
                        width: sColumnWidth + "px",
                        hAlign: "Center",
                        header: new sap.m.Label({text: sColumnLabel}),
                        visible: sColumnVisible,
                        demandPopin: true,
                        minScreenWidth: "Desktop"
                    }));
                } else {
                    oTable.addColumn(new sap.m.Column({
                        id: pModel + "-" + sColumnId,
                        width: sColumnWidth + "px",
                        header: new sap.m.Label({text: sColumnLabel}),
                        visible: sColumnVisible,
                        demandPopin: true,
                        minScreenWidth: "Desktop"
                    }));
                }
            })

            // //date/number sorting
            // oTable.attachSort(function(oEvent) {
            //     var sPath = oEvent.getParameter("column").getSortProperty();
            //     var bDescending = false;
                
            //     oTable.getColumns().forEach(col => {
            //         if (col.getSorted()) {
            //             col.setSorted(false);
            //         }
            //     })
                
            //     oEvent.getParameter("column").setSorted(true); //sort icon initiator

            //     if (oEvent.getParameter("sortOrder") === "Descending") {
            //         bDescending = true;
            //         oEvent.getParameter("column").setSortOrder("Descending") //sort icon Descending
            //     }
            //     else {
            //         oEvent.getParameter("column").setSortOrder("Ascending") //sort icon Ascending
            //     }

            //     var oSorter = new sap.ui.model.Sorter(sPath, bDescending ); //sorter(columnData, If Ascending(false) or Descending(True))
            //     var oColumn = oColumns.filter(fItem => fItem.ColumnName === oEvent.getParameter("column").getProperty("sortProperty"));
            //     var columnType = oColumn[0].DataType;

            //     if (columnType === "DATETIME") {
            //         oSorter.fnCompare = function(a, b) {
            //             // parse to Date object
            //             var aDate = new Date(a);
            //             var bDate = new Date(b);

            //             if (bDate === null) { return -1; }
            //             if (aDate === null) { return 1; }
            //             if (aDate < bDate) { return -1; }
            //             if (aDate > bDate) { return 1; }

            //             return 0;
            //         };
            //     }
            //     else if (columnType === "NUMBER") {
            //         oSorter.fnCompare = function(a, b) {
            //             // parse to Date object
            //             var aNumber = +a;
            //             var bNumber = +b;

            //             if (bNumber === null) { return -1; }
            //             if (aNumber === null) { return 1; }
            //             if (aNumber < bNumber) { return -1; }
            //             if (aNumber > bNumber) { return 1; }

            //             return 0;
            //         };
            //     }
                
            //     oTable.getBinding('rows').sort(oSorter);
            //     // prevent internal sorting by table
            //     oEvent.preventDefault();
            // });

            // TableFilter.updateColumnMenu(pTable, this);

            // // Add Column Local Props
            // pColumn.forEach(item => {
            //     if (_this._oModelColumns[pModel] && _this._oModelColumns[pModel].filter(x => x.ColumnName == item.ColumnName).length > 0) {
            //         item.ValueHelp = _this._oModelColumns[pModel][0].ValueHelp;
            //     }
            //     else {
            //         item.ValueHelp = { "show": false };
            //     }
            // })

            return {
                columns: pColumn
            }
        },

        columnTemplate: function (sColumnId) {
            var oColumnTemplate;

            oColumnTemplate = new sap.m.Text({ 
                text: "{" + sColumnId + "}", 
                wrapping: false,
                tooltip: "{" + sColumnId + "}"
            }); //default text

            return oColumnTemplate;
        },
    });

});