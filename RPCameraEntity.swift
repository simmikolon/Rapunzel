//
//  RPCameraEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 01.03.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPCameraEntity: RPEntity {

    let cameraComponent: RPCameraComponent
    let renderComponent: RPRenderComponent
    
    init(withFocusedNode node: RPNode) {

        cameraComponent = RPCameraComponent(focusedNode: node)
        renderComponent = RPRenderComponent()
        
        super.init()
        
        addComponent(cameraComponent)
    }
}
