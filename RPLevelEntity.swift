//
//  RPLevel.swift
//  Rapunzel
//
//  Created by Simon Kemper on 03.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct RPLevelLayer {

    let name: String
    let creationHandler: (RPCameraComponent) -> RPLayerEntity
}

class RPLevelEntity: RPEntity {

    let renderComponent: RPRenderComponent
    
    override init() {
        
        renderComponent = RPRenderComponent()
        super.init()
        renderComponent.node.entity = self
    }
}
