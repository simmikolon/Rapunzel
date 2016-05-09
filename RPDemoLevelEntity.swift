//
//  RPDemoLevelEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

class RPDemoLevelEntity: RPLevelEntity {
    
    init() {
        
        let dataSource = RPDemoLevelDataSource()
        super.init(withDataSource: dataSource)
    }
}
