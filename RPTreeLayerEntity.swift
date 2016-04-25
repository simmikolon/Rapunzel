//
//  RPTreeLayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 24.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

enum RPTreePlatformPosition: CGFloat {
    
    case Left = -320
    case Right = 320
}

class RPTreeLayerEntity: RPLayerEntity, RPResourceLoadableType {
    
    static var tileSize = CGSize(width: 1364, height: 192)
    static var tileAtlas: SKTextureAtlas!
    static var tileSet: RPTileSet!
    
    
    
    // ------ PROTOTYPING ------------------------------------------------------
    /*
    let minimumDistanceBetweenPlatforms: CGFloat = 150//180
    let maximumDistanceBetweenPlatforms: CGFloat = 180//250
    
    var verticalOffset: CGFloat = 200
    var horizontalOffset: RPTreePlatformPosition = .Left
    
    var platformEntities: [RPPlatformEntity]
    
    func nextPlatform() {

        let verticalOffsetDistribution = GKShuffledDistribution(lowestValue: Int(minimumDistanceBetweenPlatforms), highestValue: Int(maximumDistanceBetweenPlatforms))
        verticalOffset += CGFloat(verticalOffsetDistribution.nextInt())

        
        
        /* Wird anders gemacht: */
        if horizontalOffset == .Left { horizontalOffset = .Right }
        else { horizontalOffset = .Left }
    }
    */
    // ------------------------------------------------------------------------
    
    
    
    // MARK: Components
    
    var tileComponent: RPTileComponent!
    
    // MARK: Initialisation
    
    override init(withParallaxFactor factor: CGFloat = 1.0, cameraComponent: RPCameraComponent, zPosition: CGFloat = 0.0) {
        
        //self.platformEntities = []
        
        super.init(withParallaxFactor: factor, cameraComponent: cameraComponent, zPosition: zPosition)
        
        self.tileComponent = RPTileComponent(withEntity: self, tileSet: RPTreeLayerEntity.tileSet)
        
        let patternControllerComponent = RPPatternControllerComponent(witLayerEntity: self)
        
        addComponent(patternControllerComponent)
        addComponent(tileComponent)
        
        // -------------------------------------------------
        /*
        var numberOfInitialPlatforms = 0
        
        while verticalOffset < RPGameSceneSettings.height + 400 {
            
            let platform: RPPlatformEntity
            
            switch horizontalOffset {
            case .Right:
                platform = RPLeftBranchPlatformEntity(isBreakable: false, isBottomCollidable: false)
                break
            default:
                platform = RPBranchPlatformEntity(isBreakable: false, isBottomCollidable: false)
                break
            }
            
            platform.renderComponent.node.position = CGPoint(x: horizontalOffset.rawValue, y: verticalOffset)
            platform.renderComponent.node.zPosition = 1
            
            self.platformEntities.append(platform)
            self.renderComponent.addChild(platform.renderComponent.node)
            
            nextPlatform()
            
            numberOfInitialPlatforms += 1
        }
        */
        self.name = "RPTreeLayerEntity"
    }
    
    
    
    // --------- PROTOTYPING ------------- //
    /*
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        
        super.updateWithDeltaTime(seconds)
        
        self.tileComponent.updateWithDeltaTime(seconds)
        
        for platformEntity: RPPlatformEntity in self.platformEntities {
            
            platformEntity.updateWithDeltaTime(seconds)
            
            let platformAbsolutePosition = RPGameScene.sharedGameScene.convertPoint(platformEntity.renderComponent.node.position, fromNode: self.renderComponent.node)
            
            if platformAbsolutePosition.y < -132 {
                
                platformEntity.renderComponent.node.position.y = verticalOffset
                
                nextPlatform()
            }
        }
    }
    */
}

extension RPTreeLayerEntity {
    
    static var resourcesNeedLoading: Bool {
        return true
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        tileAtlas = SKTextureAtlas(named: "RPTreeLayer")
        tileAtlas.preloadWithCompletionHandler { () -> Void in
            
            tileSet = RPTileComponent.tileSetFromAtlas(tileAtlas)
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        tileAtlas = nil
    }
    
}
