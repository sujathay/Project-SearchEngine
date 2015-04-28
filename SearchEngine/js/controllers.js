'use strict'; 
SearchEngineApp.service('SchemaService', function ($http) {
    var SchemaInfo = [];
    var GetSchema = function () {
        $http.get('http://localhost:35752/PatientService.svc/GetMetadata').success(function (response) {
            //$scope.tables = response;
            SchemaInfo = [{
                rowId: 1, tables: response.tableNames,
                operator: response.Operators,
                groupNo: 1,
                isGrouped: false
            }];
        });
        return SchemaInfo;
    };
    return {
        GetSchema: GetSchema
    };
});
SearchEngineApp.controller("SearchController", function ($scope, $http, $filter, $timeout, UtilSrvc, ngTableParams, SchemaService,
    $rootScope, $dialogs, ngDialog) {
    $scope.modalShown = false;
    $scope.toggleModal = function () {
        $scope.modalShown = !$scope.modalShown;

    };
    $scope.SaveConfigFields = function () {
        /// <signature>
        ///<summary>Save configured value to db</summary> 
        /// </signature>
        var data = [];
        angular.forEach($scope.Configrows[0].AlltableSchema,function(item,i)
        {
            if (item.isConfigured)
                data.push({ 'table_name': item.tblId, 'field_name': item.ColumnName });
        });
        if(data.length>0)
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
        $scope.tables = response;
        $scope.Configrows = [{
            tables: response.tableNames,
            operator: response.Operators,
            selectedtable: response.tableNames[0],
            configFields: response.ConfiguredFields,
            AlltableSchema: response.AlltableSchema

        }];
        $scope.sync = function (bool, item) {

        };
        $scope.rows = [{
            rowId: 1, tables: response.tableNames,
            operator: response.Operators,
            configFields: response.ConfiguredFields,
            groupNo: 1,
            isGrouped: false
        }];


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
