'use strict';
SearchEngineApp.service('SchemaService', function ($http) {
    var SchemaInfo = [];
    var GetSchema = function () {
        $http.get('http://localhost:35752/PatientService.svc/GetMetadata').then(function (response) {
            //$scope.tables = response;
            SchemaInfo = [{
                rowId: 1, tables: response.tableNames,
                operator: response.Operators,
                groupNo: 1,
                isGrouped: false
            }];
            return SchemaInfo;
        });

    };
    return {
        GetSchema: GetSchema
    };
});
SearchEngineApp.controller("SearchController", function ($scope, $http, $filter, $window, $timeout, UtilSrvc, ngTableParams, SchemaService,
    $rootScope, $dialogs, ngDialog, $location) {

    $scope.location = $location.search();
    $scope.modalShown = false;
    $scope.toggleModal = function () {
        $scope.modalShown = !$scope.modalShown;
    };
    $scope.SaveConfigFields = function () {
        /// <signature>
        ///<summary>Save configured value to db</summary> 
        /// </signature>
        var data = [];
        angular.forEach($scope.Configrows[0].AlltableSchema, function (item, i) {
            if (item.isConfigured)
                data.push({ 'table_name': item.tblId, 'field_name': item.ColumnName });
        });
        if (data.length > 0)
            $http({
                url: 'http://localhost:35752/PatientService.svc/SaveFieldConfig?data=' + JSON.stringify(data),
                method: "POST"
            }).success(function (response) {
                console.log(response);
            });
    };
    $scope.UnGroup = function (selectedgroupNo) {
        /// <signature>
        ///<summary>Ungroup the items grouped</summary> 
        /// </signature>
        var selectedGroup = $scope.rows.filter(function (item) { return item.groupNo === selectedgroupNo });
        angular.forEach(selectedGroup, function (item) {
            $scope.rows[item.rowId - 1].groupNo = item.rowId;
            $scope.rows[item.rowId - 1].isSelected = false;
            $scope.rows[item.rowId - 1].isGrouped = false;
            $scope.rows[item.rowId - 1].isOR = false;
        });
        $scope.tableParams.reload();
    };
    $scope.GroupOr = function () {
        /// <signature>
        ///<summary>Group the selected item to OR</summary> 
        /// </signature>
        $scope.CombineItem(true);
    };
    $scope.CombineItem = function (isOR) {
        /// <signature>
        ///<summary>Group the selected item to OR/AND </summary> 
        /// </signature>
        $scope.selectedRule = [];

        $scope.selectedRule = $scope.rows.filter(function (item) { return item.isSelected === true });
        var isalreadyGrouped = $scope.selectedRule.filter(function (item) { return item.isGrouped === true }).length;
        if ($scope.selectedRule.length >= 2) {
            if (!isalreadyGrouped) {
                var groupNo = $scope.getRandomSpan();
                angular.forEach($scope.selectedRule, function (item) {
                    $scope.rows[item.rowId - 1].groupNo = groupNo;
                    $scope.rows[item.rowId - 1].isSelected = false;
                    $scope.rows[item.rowId - 1].isGrouped = true;
                    $scope.rows[item.rowId - 1].isOR = isOR;
                });
            }
            else {
                alert(' Individual conditions that are already grouped cannot be included in new groups');
            }
        }
        else {
            alert('To group conditions, select two or more rules.');
        }
        $scope.tableParams.reload();
    };
    $scope.getRandomSpan = function () {
        /// <signature>
        ///<summary>Get random number for group title</summary> 
        /// </signature>
        return Math.random() * 6;
    };
    $scope.GroupAnd = function () {
        /// <signature>
        ///<summary>Group the selected item to OR</summary> 
        /// </signature>
        $scope.CombineItem(false);
    };
    $scope.parseXml = function (xml) {
        /// <signature>
        ///<summary>Parsing xml data to json</summary> 
        /// </signature>
        var dom = null;
        if (window.DOMParser) {
            try {
                dom = (new DOMParser()).parseFromString(xml, "text/xml");
            }
            catch (e) { dom = null; }
        }
        else if (window.ActiveXObject) {
            try {
                dom = new ActiveXObject('Microsoft.XMLDOM');
                dom.async = false;
                if (!dom.loadXML(xml)) // parse error ..

                    window.alert(dom.parseError.reason + dom.parseError.srcText);
            }
            catch (e) { dom = null; }
        }
        else
            alert("cannot parse xml string!");
        return dom;
    };
    $http.get('/Config.xml').then(function (response) {
        /// <signature>
        ///<summary>Converting xml to json</summary> 
        /// </signature>
        var dom = $scope.parseXml(response.data);
        var json = $.xml2json(dom);
    });
    $http.get('http://localhost:35752/PatientService.svc/GetMetadata').success(function (response) {

        $scope.tables = response.tableNames;
        $scope.operator = response.Operators;
        $scope.Configrows = [{
            tables: response.tableNames,
            operator: response.Operators,
            selectedtable: response.tableNames[0],
            configFields: response.ConfiguredFields,
            AlltableSchema: response.AlltableSchema

        }];
        $scope.rows = [{
            rowId: 1,
            groupNo: 1,
            isGrouped: false
        }];

        if ($scope.location.isedit && $scope.location.id) {
            var selectedRule = $filter('filter')($scope.allRules, { RuleId: $scope.location.id });
            $scope.rows.length = 0;
            $scope.rows.push({
                "selectedtable": { "tblId": selectedRule[0].tableId },
                "selectedField": { "ColId": selectedRule[0].ColId, "DataTypeId": 56, },
                "selectedOperator": { "OperatorId": selectedRule[0].OperatorId, },
                "selectedValue": "12", "isGrouped": selectedRule[0].isGrouped, "isOR": selectedRule[0].IsOR,
                "isSelected": false, "groupNo": selectedRule[0].GroupNo

            });
            //    [{
            //    "rowid": 1, "selectedtable": { "ColId": 1, "ColumnName": "demographics_id", "DataTypeId": 127, "foreignkeyColName": "patient_id", "max_length": 8, "tblId": 309576141, "tblName": "Demographics" },
            //    "selectedField": { "ColId": 3, "ColumnName": "age", "DataTypeId": 56, "foreignkeyColName": "patient_id", "max_length": 4, "tblId": 309576141, "tblName": "Demographics" },
            //    "selectedOperator": { "OperatorId": 14, "OperatorName": "Equals", "datatypeSupported": "56", "sql_operator": "=" },
            //    "selectedValue": "12", "isGrouped": true, "isOR": false,
            //    "isSelected": false, "groupNo": 4.562486649490893
            //}, {
            //    "rowid": 2, "selectedtable": { "ColId": 1, "ColumnName": "demographics_id", "DataTypeId": 127, "foreignkeyColName": "patient_id", "max_length": 8, "tblId": 309576141, "tblName": "Demographics" },
            //    "selectedField": { "ColId": 4, "ColumnName": "gender", "DataTypeId": 175, "foreignkeyColName": "patient_id", "max_length": 8000, "tblId": 309576141, "tblName": "Demographics" },
            //    "selectedOperator": { "OperatorId": 17, "OperatorName": "Equals", "datatypeSupported": "175", "sql_operator": "=" }, "selectedValue": "f", "isGrouped": true, "isOR": false, "isSelected": false, "groupNo": 4.562486649490893
            //},
            //{
            //    "rowid": 3, "selectedtable": { "ColId": 1, "ColumnName": "patientproblem_id", "DataTypeId": 56, "foreignkeyColName": "patient_id", "max_length": 4, "tblId": 1205579333, "tblName": "CDS_PatientProblem" },
            //    "selectedField": { "ColId": 3, "ColumnName": "problem", "DataTypeId": 167, "foreignkeyColName": "patient_id", "max_length": 8000, "tblId": 1205579333, "tblName": "CDS_PatientProblem" },
            //    "selectedOperator": { "OperatorId": 6, "OperatorName": "Contains", "datatypeSupported": "167", "sql_operator": "%%" }, "selectedValue": "fever", "isGrouped": false, "groupNo": 3
            //}];
        }
        else {
            $scope.GetRule();
        }
        $scope.tableParams = new ngTableParams({
            page: 1,            // show first page
            count: 100          // count per page
        }, {
            counts: [],// hides page sizes
            groupBy: 'groupNo',
            total: $scope.rows.length,
            grouptotal: $scope.rows.length,
            getData: function ($defer, params) {
                var orderedData = params.sorting() ?
                        $filter('orderBy')($scope.rows, $scope.tableParams.orderBy()) :
                        $scope.rows;

                $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
        });
    });
    $scope.SaveRule = function () {
        var data = [];
        angular.forEach($scope.rows, function (item, i) {
            data.push({
                'tblId': item.selectedtable.tblId,
                'OperatorId': item.selectedOperator.OperatorId,
                "ColId": item.selectedField.ColId,
                "isGrouped": item.isGrouped,
                "groupNo": item.groupNo,
                "selectedValue": item.selectedValue,
                "isOR": (item.isOR) ? false : true
            });
        });
        if (data.length > 0)
            $http({
                url: 'http://localhost:35752/PatientService.svc/SaveRule?data=' + JSON.stringify(data),
                method: "POST"
            }).success(function (response) {
                console.log(response);
            });
        $scope.GetRule();
    };
    $scope.GetRule = function () {
        $http.get('http://localhost:35752/PatientService.svc/GetRule').success(function (response) {
            $scope.allRules = response;
            var data = {
                colNames: ['Table Name', 'Field Name', 'Operator', 'Value'],
                data: $scope.allRules,
                colModel: [
                     { name: 'TableName' },
                     { name: 'ColName' },
                     { name: 'SelectedValue'  },
                     { name: 'RuleId', hidden: false, formatter: editLink } ] };
            var searchObj = {
                gridID: 'searchGrid',
                ht: 250,
                width: null,
                shrinkToFit: false,
                dataSource: data,
                PageSize: 5,
                sortBy: 'permobil_name',
                isDesc: false,
                RefreshGridHandler: null,
                CaptionText: null,
                customActionObj: null,
                gridCompleted: null,
                onRowDelete: null,
                rowDoubleClickHandler: null,
                onSelectRow: $scope.editrule
            };
            SE.CustomGrid.createGrid(searchObj);
        });
        //RuleId = a.rule_id,
        //                OperatorId = a.operator_id,
        //                ColId = a.column_id,
        //                isGrouped = a.isgrouped,
        //                IsOR = a.isor,
        //                SelectedValue = a.value,
        //                GroupNo = a.groupno,
        //                tableId = a.table_id,
        //                TableName = a.tableName,
        //                ColName = a.ColName
        //$scope.allRules = [{
        //    "rowid": 1,
        //    "selectedtable": {  "tblId": 309576141 },
        //    "selectedField": { "ColId": 3,  "DataTypeId": 56,   },
        //    "selectedOperator": { "OperatorId": 14,   },
        //    "selectedValue": "12", "isGrouped": true, "isOR": false,
        //    "isSelected": false, "groupNo": 4.562486649490893
        //}, {
        //    "rowid": 2,
        //    "selectedtable": {   "tblId": 309576141, },
        //    "selectedField": { "ColId": 4,   "DataTypeId": 175,   },
        //    "selectedOperator": { "OperatorId": 17 },
        //    "selectedValue": "f", "isGrouped": true, "isOR": false, "isSelected": false, "groupNo": 4.562486649490893
        //},
        //   {
        //       "rowid": 3,
        //       "selectedtable": {   "tblId": 1205579333  },
        //       "selectedField": { "ColId": 3, "DataTypeId": 167  },
        //       "selectedOperator": { "OperatorId": 102  }, "selectedValue": "fever", "isGrouped": false, "groupNo": 3
        //   }]; 

    };
    function editLink(cellValue, options, rowdata, action) {
        return "<a href='/#/Search?isedit=true&id=" + rowdata.RuleId + "' class='ui-icon ui-icon-pencil' ><img src='../images/edit.png'/></a>";
    }
    $scope.editrule = function (grid, $window) {
        $location.path("/Search?edit/id=12");
        //$location.search('isedit', 'true').search('id', '12');
    };
    $scope.GetSearch = function () {
        /// <signature>
        ///<summary>Search  </summary> 
        /// </signature>
        var objSearch = [];
        var tableName = "", operators = "", columnName = "", values = "", primarykey = "", isGrouped = "", groupNo = "", isOR = "";
        angular.forEach($scope.rows, function (item) {
            tableName += item.selectedtable.tblName + ",";
            operators += item.selectedOperator.sql_operator + ",";
            columnName += item.selectedField.ColumnName + ",";
            values += item.selectedValue + ",";
            primarykey += item.selectedtable.foreignkeyColName + ",";
            isGrouped += item.isGrouped + ",";
            groupNo += item.groupNo + ",";
            isOR += item.isOR + ",";
        });

        // removing end comma
        tableName = tableName.substring(0, tableName.length - 1);
        operators = operators.substring(0, operators.length - 1);
        columnName = columnName.substring(0, columnName.length - 1);
        values = values.substring(0, values.length - 1);
        primarykey = primarykey.substring(0, primarykey.length - 1);
        isGrouped = isGrouped.substring(0, isGrouped.length - 1);
        groupNo = groupNo.substring(0, groupNo.length - 1);
        isOR = isOR.substring(0, isOR.length - 1);
        objSearch.push({
            'tableName': tableName,
            'columnName': columnName,
            'operators': operators,
            'values': values,
            'primarykey': primarykey,
            'isGrouped': isGrouped,
            'groupNo': groupNo,
            'isOR': isOR
        });
        $http({
            url: 'http://localhost:35752/PatientService.svc/GetSearch?criteria=' + JSON.stringify(objSearch),
            method: "GET"
        }).success(function (response) {
            var data = {
                colNames: ['Age', 'Gender'],
                data: response,
                colModel: [
                     { name: 'PatientName' },
                    { name: 'Address' }
                ]
            };
            var searchObj = {
                gridID: 'searchGrid',
                ht: 250,
                width: null,
                shrinkToFit: false,
                dataSource: data,
                PageSize: 5,
                sortBy: 'permobil_name',
                isDesc: false,
                RefreshGridHandler: null,
                CaptionText: null,
                customActionObj: null,
                gridCompleted: null,
                onRowDelete: null,
                rowDoubleClickHandler: null,
                onSelectRow: null
            };
            SE.CustomGrid.createGrid(searchObj);
            console.log(response);
        });
    };
    $scope.GetRule();
    $scope.addNewRow = function () {
        /// <signature>
        ///<summary>Adding new rule</summary> 
        /// </signature>

        if ($scope.rows[$scope.rows.length - 1].selectedField
            && $scope.rows[$scope.rows.length - 1].selectedtable
            && $scope.rows[$scope.rows.length - 1].selectedOperator
            && $scope.rows[$scope.rows.length - 1].selectedValue) {
            $scope.rows.push({
                rowId: $scope.rows.length + 1, tables: $scope.rows[0]["tables"],
                operator: $scope.rows[0]["operator"],
                groupNo: $scope.rows.length + 1,
                isGrouped: false
            });
            $scope.tableParams.reload();
        }

    }
    $scope.removeRow = function (item) {
        /// <signature>
        ///<summary>Removing rule</summary> 
        /// </signature>
        $scope.rows.pop({ "rowId": $scope.rows.length + 1 });
        $scope.tableParams.reload();
    };
});

SearchEngineApp.controller('groupCtrl', function ($scope) {
});
