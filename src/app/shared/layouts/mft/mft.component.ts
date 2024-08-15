import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  effect,
  signal
} from '@angular/core';

import { API, APIDefinition, Config, DefaultConfig } from 'ngx-easy-table';
import { Platform } from '@ionic/angular';
@Component({
  selector: 'app-mft',
  templateUrl: './mft.component.html',
  styleUrls: ['./mft.component.scss'],
})
// multi functional table
export class MftComponent implements OnInit {
  @Input() label:string;
  @Input() desc:string;
  @Input() tableId: string;
  @Input() checkboxes: boolean = false
  @Input() paginationEnabled: boolean = false
  @Input('tableRows') tableRows = 5;
  @Input('tableMenuOptions') tableMenuOptions: string[] = []
    //@ts-ignore
  @Input('tableColumns') tableColumns 
    //@ts-ignore
  @Input('tableData') tableData 

  @Input('searchBoxEnable') searchBoxEnable: boolean = false
  @Output('onRowClicked') onRowClicked = new EventEmitter()
  @Output('onTabSelected') onTabSelected = new EventEmitter()
  @Output('onSearch') onSearch = new EventEmitter()
  @Output('onEmitData') onEmitData = new EventEmitter()
  //@ts-ignore
  @ViewChild('table', { static: true }) table: APIDefinition;


  public tab = signal(this.tableMenuOptions[0])

  public tabSelected(tab: string) {
    this.tab.set(tab);
    this.onTabSelected.emit(tab);
  }

  public configuration: Config = {
    ...DefaultConfig,
    orderEnabled: true,
    // threeWaySort: true,
    showDetailsArrow: true,
    paginationRangeEnabled: false,
    paginationEnabled: this.paginationEnabled,
    rows: this.tableRows,
    // fixedColumnWidth: true,
    // horizontalScroll: true,
    isLoading: false,
  };
  ngOnInit(): void {
    this.configuration.rows = this.tableRows;
    this.configuration.checkboxes = this.checkboxes;
    if(this._platform.width() < 992){
      this.configuration.horizontalScroll = true;
    }
  }
  
  previousPage() {
    const res = this.table.apiEvent({
      type: API.getPaginationCurrentPage,
    });
    this.table.apiEvent({
      type: API.setPaginationCurrentPage,
      value: res - 1,
    });

  }
  nextPage() {
    const itemsPerPage = this.tableRows
    let lastPage = this.table.apiEvent({
      type: API.getPaginationTotalItems,
    }) / itemsPerPage;
    const currentPage = this.table.apiEvent({
      type: API.getPaginationCurrentPage,
    });

    if (lastPage > currentPage) {
      this.table.apiEvent({
        type: API.setPaginationCurrentPage,
        value: currentPage + 1,
      });
    }


  }
  constructor(private _platform: Platform) { 
    effect(() =>{
      if(this.tableData && this.tableData()?.length ){
        
        setTimeout(() => {
          
          this.configuration.isLoading = false;
  
        }, 100);
      } else{
        this.configuration.isLoading = true;
      }
      if(!this.paginationEnabled && this.tableData && this.tableData()?.length < this.tableRows){
        this.configuration.paginationEnabled = false
      }else{
        this.configuration.paginationEnabled = true
      }

    })
    console.log(this.configuration.isLoading);
  }
  public searchTerm = signal('')
  searchItem(term: any) {
    this.searchTerm.set(term);
    this.onSearch.emit(term)

    this.table.apiEvent({
      type: API.onGlobalSearch,
      value: this.searchTerm(),
    });
  }
  allSelected = false;
  tableEventEmitted(event: { event: string; value: any }): void {
    console.log(event);
    
    if (event.event === 'onSelectAll') {
      this.allSelected = this.tableData().filter((row: any) => (row.selected = event.value));
    }
    console.log(this.allSelected);
  }

  rowSelected(): void {
    this.allSelected = this.tableData().every((row) => !!row.selected);
    console.log(this.allSelected);
    
  }
  // tableEventEmitted(event): void {
  //   console.log(event, this.tableData());
    
  //   if (event.event === 'onSelectAll') {
  //     this.tableData().forEach((row: any) => (row.selected = event.value));
  //   }
  //   console.log(this.allSelected);
    
  //   this.onEmitData.emit(this.allSelected)
  // }

  // rowSelected(): void {
  //   this.allSelected = this.tableData().every((row) => !!row.selected);
  //   this.onEmitData.emit(this.allSelected)
  // }
  eventEmitted($event: { event: string; value: any }): void {

  }
}
